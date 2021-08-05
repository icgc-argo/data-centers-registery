/*
 * Copyright (c) 2020 The Ontario Institute for Cancer Research. All rights reserved
 *
 * This program and the accompanying materials are made available under the terms of
 * the GNU Affero General Public License v3.0. You should have received a copy of the
 * GNU Affero General Public License along with this program.
 *  If not, see <http://www.gnu.org/licenses/>.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 * SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import mongoose from 'mongoose';
import _ from 'lodash';

export type Properties = { [key: string]: string[] | string | number | boolean };

export interface DataCenter {
  country: string;
  name: string;
  type: string;
  organization: string;
  centerId: string;
  storageType: string;
  contactEmail: string;
  songUrl: string;
  scoreUrl: string;
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
    throw new Errors.NotFound('No record found for this id');
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
  dc.contactEmail = newDc.contactEmail;
  dc.storageType = newDc.storageType;
  dc.organization = newDc.organization;
  dc.songUrl = newDc.songUrl;
  dc.scoreUrl = newDc.scoreUrl;
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

  if (!dc.organization) {
    throw new Errors.InvalidArgument('organization is missing');
  }

  if (!dc.storageType) {
    throw new Errors.InvalidArgument('storageType is missing');
  }

  if (!dc.songUrl) {
    throw new Errors.InvalidArgument('songUrl is missing');
  }
  if (!dc.scoreUrl) {
    throw new Errors.InvalidArgument('scoreUrl is missing');
  }

  if (!dc.contactEmail) {
    throw new Errors.InvalidArgument('contactEmail is missing');
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
    type: { type: String, required: true },
    organization: { type: String, required: true },
    storageType: { type: String, required: true },
    songUrl: { type: String, required: true },
    scoreUrl: { type: String, required: true },
    contactEmail: { type: String, required: true },
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
    organization: center.organization,
    contactEmail: center.contactEmail,
    storageType: center.storageType,
    songUrl: center.songUrl,
    scoreUrl: center.scoreUrl,
    type: center.type,
  };
}
export type DataCenterDocument = mongoose.Document & DataCenter;

export const DataCenterModel = mongoose.model<DataCenterDocument>('Datacenter', DataCenterSchema);
