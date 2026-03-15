import { getDataSource } from "../database/postgresql.js";

async function getUserRepository() {
  const dataSource = await getDataSource();
  return dataSource.getRepository("User");
}

function toModel(row, includePassword = false) {
  if (!row) {
    return null;
  }

  const model = {
    _id: row.id,
    username: row.username,
    phone: row.phone,
    created_at: row.created_at,
    updated_at: row.updated_at,
    toObject() {
      return {
        _id: this._id,
        username: this.username,
        phone: this.phone,
        password: this.password,
        created_at: this.created_at,
        updated_at: this.updated_at,
      };
    },
    async save() {
      const repo = await getUserRepository();
      const toSave = {
        id: this._id,
        username: this.username,
        phone: this.phone,
        password: this.password,
      };

      await repo.save(toSave);

      const found = await repo
        .createQueryBuilder("user")
        .addSelect("user.password")
        .where("user.id = :id", { id: this._id })
        .getOne();

      const next = toModel(found, true);
      Object.assign(this, next);
      return this;
    },
  };

  if (includePassword) {
    model.password = row.password;
  }

  return model;
}

class QueryBuilder {
  constructor(executor) {
    this.executor = executor;
    this.includePassword = false;
    this.asLean = false;
  }

  select(fields = "") {
    this.includePassword = fields.includes("+password");
    return this;
  }

  lean() {
    this.asLean = true;
    return this.exec();
  }

  exec() {
    return this.executor({
      includePassword: this.includePassword,
      asLean: this.asLean,
    });
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

const User = {
  findOne(filter = {}) {
    return new QueryBuilder(async ({ includePassword, asLean }) => {
      const { phone, username } = filter;
      if (!phone && !username) {
        return null;
      }

      const repo = await getUserRepository();
      let qb = repo.createQueryBuilder("user");

      if (includePassword) {
        qb = qb.addSelect("user.password");
      }

      if (phone) {
        qb = qb.where("user.phone = :phone", { phone });
      } else {
        qb = qb.where("user.username = :username", { username });
      }

      const found = await qb.getOne();
      const model = toModel(found, includePassword);

      if (!model) {
        return null;
      }

      return asLean ? model.toObject() : model;
    });
  },

  findById(id) {
    return new QueryBuilder(async ({ includePassword, asLean }) => {
      const repo = await getUserRepository();
      let qb = repo.createQueryBuilder("user");

      if (includePassword) {
        qb = qb.addSelect("user.password");
      }

      const found = await qb.where("user.id = :id", { id }).getOne();
      const model = toModel(found, includePassword);

      if (!model) {
        return null;
      }

      return asLean ? model.toObject() : model;
    });
  },

  async create(data = {}) {
    const { username, phone, password } = data;
    const repo = await getUserRepository();

    const created = repo.create({ username, phone, password });
    await repo.save(created);

    const found = await repo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :id", { id: created.id })
      .getOne();

    return toModel(found, true);
  },
};

export default User;
