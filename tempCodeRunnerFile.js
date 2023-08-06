/* global use, db */
// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('flash-card');

// Create a new document in the collection.
db.getCollection('botusers').insertOne({
  phoneNumber: '998915411999',
  chatId: '678719517',
  isAdmin: false,
  fullName: 'Aslamjon2',
  deleted: false,
  createdAt: ISODate('2023-07-27T04:25:06.917Z'),
  __v: 0
});
