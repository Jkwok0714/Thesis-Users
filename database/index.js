const elasticsearch = require('elasticsearch');
const configs = require('../config/config.js');

const client = new elasticsearch.Client({
  host: configs.elasticUri
});

const INDEX_NAME = 'userslist';
const USER_TYPE = 'User';

let appendId = (obj) => {
  let result = obj._source;
  result.id = obj._id;
  return result;
};

let pingServer = () => {
  client.ping({}, function (error) {
    if (error) {
      console.trace('Elasticsearch cluster is down!');
    } else {
      console.log('==== All is well ====');
      // submitNewUser(1);
    }
  });
};

let deleteAllUsers = () => {
  return new Promise((resolve, reject) => {
    client.deleteByQuery({
      index: INDEX_NAME
    }, function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

let getRandomUser = () => {
  let a = new Date().getTime().toString();
  return new Promise((resolve, reject) => {
    client.search({
      index: INDEX_NAME,
      size: 1,
      body: { query: {
        function_score: {
          random_score: { seed: a }
        }
      }}
    }, function(err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(appendId(res.hits.hits[0]));
      }
    });
  });
};

let queryByName = (name) => {
  return new Promise((resolve, reject) => {
    client.search({
      index: INDEX_NAME,
      q: 'name:' + name
    }, function(err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(appendId(res.hits.hits[0]));
      }
    });
  });
};

let queryById = (userId) => {
  return new Promise((resolve, reject) => {
    client.get({
      index: INDEX_NAME,
      type: USER_TYPE,
      id: userId
    }, function (err, res) {
      if (err) {
        reject(err);
      }
      resolve(appendId(res));
    });
  });
};

//location, genderFilter, userFilter[]
let queryByLocation = (options) => {
  let queryString = 'location:' + options.location;
  if (options.genderFilter) {
    queryString += ' gender:' + options.genderFilter;
  }
  if (options.userFilter) {
    queryString += ' id:';
    for (var ele of options.userFilter) {
      queryString += '-' + ele;
    }
  }
  // console.log('query:', queryString, '\n');
  return new Promise((resolve, reject) => {
    client.search({
      index: INDEX_NAME,
      size: 50,
      q: queryString
    }, function(err, res) {
      if (err) {
        reject(err);
      } else {
        let result = res.hits.hits.map((ele) => {
          return appendId(ele);
        });
        resolve(result);
      }
    });
  });
};

module.exports = {
  pingServer,
  deleteAllUsers,
  getRandomUser,
  queryByName,
  queryById,
  queryByLocation
};
