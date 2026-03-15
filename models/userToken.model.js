import { getDataSource } from "../database/postgresql.js";

async function getUserTokenRepository() {
  const dataSource = await getDataSource();
  return dataSource.getRepository("UserToken");
}

const UserToken = {
  async findOne(filter = {}) {
    const { token, userId } = filter;
    if (!token && !userId) {
      return null;
    }

    const repo = await getUserTokenRepository();
    const where = token ? { token } : { userId };
    const found = await repo.findOne({ where });

    if (!found) {
      return null;
    }

    return {
      id: found.id,
      userId: found.userId,
      token: found.token,
      createdAt: found.created_at,
    };
  },

  async findOneAndDelete(filter = {}) {
    const { userId } = filter;
    if (!userId) {
      return null;
    }

    const repo = await getUserTokenRepository();
    const existing = await repo.findOne({ where: { userId } });

    if (!existing) {
      return null;
    }

    await repo.delete({ userId });

    return {
      id: existing.id,
      userId: existing.userId,
      token: existing.token,
      createdAt: existing.created_at,
    };
  },

  async deleteByToken(token) {
    if (!token) {
      return false;
    }

    const repo = await getUserTokenRepository();
    const result = await repo
      .createQueryBuilder()
      .delete()
      .from("user_tokens")
      .where("token = :token", { token })
      .execute();

    return (result.affected || 0) > 0;
  },

  async deleteExpiredBefore(cutoffDate) {
    if (!cutoffDate) {
      return 0;
    }

    const repo = await getUserTokenRepository();
    const result = await repo
      .createQueryBuilder()
      .delete()
      .from("user_tokens")
      .where("created_at < :cutoff", { cutoff: cutoffDate })
      .execute();

    return result.affected || 0;
  },

  async create(docs = []) {
    const doc = Array.isArray(docs) ? docs[0] : docs;
    if (!doc?.userId || !doc?.token) {
      return [];
    }

    const repo = await getUserTokenRepository();
    const created = repo.create({ userId: doc.userId, token: doc.token });
    const saved = await repo.save(created);

    return [
      {
        id: saved.id,
        userId: saved.userId,
        token: saved.token,
        createdAt: saved.created_at,
      },
    ];
  },
};

export default UserToken;
