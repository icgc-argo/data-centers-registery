import { Mongoose } from 'mongoose';

import mongoose from 'mongoose';
export interface DataCenter {
  country: string;
  name: string;
  centerId: string;
  properties: { [key: string]: string[] };
}

export type QueryFilters = {
  country?: string[];
  name?: string[];
  properties?: { [key: string]: string[] }[];
};

export async function searchByPropertiesQuery(query: any) {
  // todo: validate queries are all valid and no functions

  const $or = query.map((q: any) => {
    const updatedQuery: { [k: string]: any } = {};
    Object.keys(q).forEach(k => {
      updatedQuery[`properties.${k}`] = q[k];
    });
    return updatedQuery;
  });

  const result = await DataCenterModel.find({
    $or,
  });
  return result;
}

export async function getFiles(filters: QueryFilters) {
  return (await DataCenterModel.find(buildQueryFilters(filters)).exec()) as DataCenterDocument[];
}

export async function byId(id: string) {
  return await DataCenterModel.findOne({ centerId: id });
}

export async function create(dc: DataCenter) {
  const existing = await byId(dc.centerId);
  if (existing) {
    throw new Errors.StateConflict('');
  }
  const newDc = new DataCenterModel(dc);
  const createdFile = await newDc.save();
  return createdFile;
}

export async function deleteDc(id: string) {
  const dc = await byId(id);
  if (!dc) {
    throw new Errors.NotFound('');
  }
  await DataCenterModel.deleteOne({ centerId: id });
}

export async function update(newDc: DataCenter) {
  const dc = await byId(newDc.centerId);
  if (!dc) {
    throw new Errors.NotFound('');
  }

  dc.country = newDc.country;
  dc.name = newDc.name;
  dc.properties = newDc.properties;
  const updated = await dc.save();
  return updated;
}

export namespace Errors {
  export class InvalidArgument extends Error {
    constructor(message: string) {
      super(message);
    }
  }

  export class NotFound extends Error {
    constructor(msg: string) {
      super(msg);
    }
  }

  export class StateConflict extends Error {
    constructor(msg: string) {
      super(msg);
    }
  }
}

const DataCenterSchema = new mongoose.Schema(
  {
    centerId: { type: String, index: true, unique: true, required: true },
    country: { type: String, required: true },
    name: { type: String, required: true },
    properties: { type: {} },
  },
  { timestamps: true, minimize: false, optimisticConcurrency: true } as any,
);

function buildQueryFilters(filters: QueryFilters) {
  const queryFilters: mongoose.MongooseFilterQuery<DataCenterDocument> = {};
  if (filters.country && filters.country.length > 0) {
    queryFilters.analysisId = {
      $in: filters.country,
    };
  }
  if (filters.name && filters.name.length > 0) {
    queryFilters.name = {
      $in: filters.name,
    };
  }
  // todo: handle properties filter
  return queryFilters;
}

export type DataCenterDocument = mongoose.Document & DataCenter;

export const DataCenterModel = mongoose.model<DataCenterDocument>('Datacenter', DataCenterSchema);
