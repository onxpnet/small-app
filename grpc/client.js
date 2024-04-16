var PROTO_PATH = __dirname + '/protos/news.proto';

var parseArgs = require('minimist');
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var news_proto = grpc.loadPackageDefinition(packageDefinition).news;

// function main() {
//   var argv = parseArgs(process.argv.slice(2), {
//     string: 'target'
//   });
//   var target;
//   if (argv.target) {
//     target = argv.target;
//   } else {
//     target = 'localhost:50051';
//   }
//   var client = new news_proto.News(target,
//                                        grpc.credentials.createInsecure());
//   var title;
//   if (argv._.length > 0) {
//     title = argv._[0];
//   } else {
//     title = 'Bad News';
//   }
//   client.sayNews({title: title}, function(err, response) {
//     console.log('News:', response.content + ', Priority: ' + response.priority);
//   });
// }

function main() {
  return new Promise((resolve, reject) => {
    var argv = parseArgs(process.argv.slice(2), {
      string: 'target'
    });
    var target;
    if (argv.target) {
      target = argv.target;
    } else {
      target = 'localhost:50051';
    }
    var client = new news_proto.News(target,
                                         grpc.credentials.createInsecure());
    var title;
    if (argv._.length > 0) {
      title = argv._[0];
    } else {
      title = 'Bad News';
    }
    client.sayNews({title: title}, function(err, response) {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
}

module.exports = main;