const path = require('path');

const mockTours = [
  {
    _id: '1',
    isAccepted: true,
    city: 'Patna',
    visitngPlaces: '1N Patna | 2N Gaya',
    visitingPlaces: null,
    themes: ['heritage'],
    overview: 'Sample tour',
    price: 1000,
    nights: 2,
    tourStartDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    tourEndDate: null,
    createdAt: new Date(),
  },
  {
    _id: '2',
    isAccepted: true,
    city: 'Delhi',
    visitngPlaces: null,
    visitingPlaces: '1N Delhi | 2N Agra',
    themes: ['heritage'],
    overview: 'Another tour',
    price: 2000,
    nights: 3,
    tourStartDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    tourEndDate: new Date(),
    createdAt: new Date(),
  },
];

const mockModel = {
  find: (filter) => {
    const docs = mockTours.filter(t => {
      if (filter && filter.isAccepted !== undefined) return t.isAccepted === filter.isAccepted;
      return true;
    });
    let q = {
      sort: () => q,
      skip: () => q,
      limit: () => q,
      lean: () => Promise.resolve(docs),
    };
    return q;
  },
  countDocuments: (filter) => Promise.resolve(mockTours.length),
};

const modelPath = path.resolve(__dirname, '..', 'models', 'tour', 'tour.js');
try {
  const resolved = require.resolve(modelPath);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports: mockModel };
} catch (err) {
  require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: mockModel };
}

const controllerPath = path.resolve(__dirname, '..', 'controllers', 'tour', 'tour.js');
const controller = require(controllerPath);

const req = { query: {} };
const res = {
  status(code) { this.code = code; return this; },
  json(obj) { console.log('RESPONSE', JSON.stringify(obj, null, 2)); return obj; }
};

(async () => {
  try {
    console.log('Calling filterTours with empty query (no filters)...');
    await controller.filterTours(req, res);
    console.log('Done.');
  } catch (e) {
    console.error('ERROR', e);
  }
})();
