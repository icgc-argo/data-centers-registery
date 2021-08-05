module.exports = {
  async up(db, client) {
    const datacenters = await db
      .collection('Datacenter')
      .find({})
      .toArray();
    const operations = datacenters.map(datacenter => {
      return (
        datacenter.url &&
        db.collection('Datacenter').updateOne(
          { _id: datacenter._id },
          {
            $set: { songUrl: datacenter.url, scoreUrl: datacenter.url },
            $unset: { url: 1 },
          },
        )
      );
    });
    return Promise.all(operations);
  },

  async down(db, client) {
    // No state to rollback to.
  },
};
