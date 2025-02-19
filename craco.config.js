module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "buffer": false,
          "crypto": false,
          "stream": false,
          "util": false,
          "url": false,
          "http": false,
          "https": false,
          "zlib": false,
          "querystring": false,
          "path": false,
          "os": false,
          "fs": false,
          "net": false,
          "tls": false,
          "child_process": false,
        },
      },
    },
  },
}; 