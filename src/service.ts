import { Mongoose } from 'mongoose';

import mongoose from 'mongoose';
import _ from 'lodash';

export type Properties = { [key: string]: string[] | string | number | boolean };

export interface DataCenter {
  country: string;
  name: string;
  type: string;
  centerId: string;
  properties: Properties;
}

export type QueryFilters = {
  country?: string[];
  name?: string[];
  type?: string[];
  centerId?: string[];
};

export async function advSearchByQuery(query: mongoose.FilterQuery<DataCenter>) {
  if (!query) {
    throw new Errors.InvalidArgument('body should be a valid filter query');
  }
  const result = await DataCenterModel.find(query).exec();
  return result.map(docToPojo);
}

export async function getMany(filters: QueryFilters): Promise<DataCenter[]> {
  const result = await DataCenterModel.find(buildQueryFilters(filters)).exec();
  return result.map(docToPojo);
}

export async function byId(id: string): Promise<DataCenter> {
  const center = await findById(id);
  if (center == undefined) {
    throw new Errors.NotFound('');
  }
  return docToPojo(center);
}

export async function create(dc: DataCenter) {
  validateDataCenter(dc);
  const existing = await findById(dc.centerId);
  if (existing) {
    throw new Errors.StateConflict('');
  }
  const newDc = new DataCenterModel(dc);
  const createdFile = await newDc.save();
  return docToPojo(createdFile);
}

export async function deleteDc(id: string) {
  const dc = await findById(id);
  if (!dc) {
    throw new Errors.NotFound('');
  }
  await DataCenterModel.deleteOne({ centerId: id });
}

export async function update(newDc: DataCenter) {
  validateDataCenter(newDc);
  const dc = await findById(newDc.centerId);
  if (!dc) {
    throw new Errors.NotFound('');
  }
  dc.country = newDc.country;
  dc.name = newDc.name;
  dc.type = newDc.type;
  dc.properties = newDc.properties;
  const updated = await dc.save();
  return docToPojo(updated);
}

function validateDataCenter(dc: DataCenter) {
  if (!dc.centerId) {
    throw new Errors.InvalidArgument('centerId is missing');
  }
  if (!dc.country) {
    throw new Errors.InvalidArgument('country is missing');
  }
  if (!dc.name) {
    throw new Errors.InvalidArgument('name is missing');
  }
  if (!dc.type) {
    throw new Errors.InvalidArgument('type is missing');
  }
  validateProperties(dc.properties);
}

function validateProperties(properties: Properties) {
  if (!properties) {
    return true;
  }

  const valid = _.every(Object.keys(properties), (k: string) => {
    console.log(`property ${k} type =${typeof properties[k]}`);
    if (typeof properties[k] == 'boolean') {
      return true;
    }
    if (typeof properties[k] == 'number') {
      return true;
    }
    if (typeof properties[k] == 'string') {
      return true;
    }
    if (_.isArray(properties[k])) {
      const validArray = _.every(properties[k] as Array<any>, v => typeof v == 'string');
      console.log(`valid array: ${validArray}`);
      return validArray;
    }
    return false;
  });
  if (!valid) {
    throw new Errors.InvalidArgument(
      'Properties can only be string, string[], number or boolean, and cannot be nested further',
    );
  }
}
async function findById(id: string) {
  const center = await DataCenterModel.findOne({ centerId: id });
  return center;
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
  if (filters.type && filters.type.length > 0) {
    queryFilters.type = {
      $in: filters.type,
    };
  }
  if (filters.centerId && filters.centerId.length > 0) {
    queryFilters.centerId = {
      $in: filters.centerId,
    };
  }
  return queryFilters;
}

function docToPojo(center: DataCenterDocument): DataCenter {
  return {
    centerId: center.centerId,
    country: center.country,
    name: center.name,
    properties: center.properties,
    type: center.type,
  };
}
export type DataCenterDocument = mongoose.Document & DataCenter;

export const DataCenterModel = mongoose.model<DataCenterDocument>('Datacenter', DataCenterSchema);
