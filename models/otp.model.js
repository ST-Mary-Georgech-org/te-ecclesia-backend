import { getDataSource } from "../database/postgresql.js";

async function getOtpRepository() {
  const dataSource = await getDataSource();
  return dataSource.getRepository("Otp");
}

const Otp = {
  async createOrReplace(data = {}) {
    const { phone, purpose, otp, payload = null, expiresAt } = data;

    if (!phone || !purpose || !otp || !expiresAt) {
      return null;
    }

    const repo = await getOtpRepository();
    await repo.delete({ phone, purpose });

    const created = repo.create({
      phone,
      purpose,
      otp,
      payload,
      expires_at: expiresAt,
      is_verified: false,
    });

    const saved = await repo.save(created);

    return {
      id: saved.id,
      phone: saved.phone,
      purpose: saved.purpose,
      otp: saved.otp,
      payload: saved.payload,
      isVerified: saved.is_verified,
      expiresAt: saved.expires_at,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    };
  },

  async findOne(filter = {}) {
    const { phone, purpose, otp } = filter;

    if (!phone || !purpose) {
      return null;
    }

    const repo = await getOtpRepository();
    const where = otp ? { phone, purpose, otp } : { phone, purpose };

    const found = await repo.findOne({ where, order: { created_at: "DESC" } });

    if (!found) {
      return null;
    }

    return {
      id: found.id,
      phone: found.phone,
      purpose: found.purpose,
      otp: found.otp,
      payload: found.payload,
      isVerified: found.is_verified,
      expiresAt: found.expires_at,
      createdAt: found.created_at,
      updatedAt: found.updated_at,
    };
  },

  async markVerified(id) {
    if (!id) {
      return null;
    }

    const repo = await getOtpRepository();
    await repo.update({ id }, { is_verified: true });

    const updated = await repo.findOne({ where: { id } });
    if (!updated) {
      return null;
    }

    return {
      id: updated.id,
      phone: updated.phone,
      purpose: updated.purpose,
      otp: updated.otp,
      payload: updated.payload,
      isVerified: updated.is_verified,
      expiresAt: updated.expires_at,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  },

  async deleteById(id) {
    if (!id) {
      return;
    }

    const repo = await getOtpRepository();
    await repo.delete({ id });
  },
};

export default Otp;
