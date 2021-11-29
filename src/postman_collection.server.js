// Serve a postman collection file as if it is an API.
// USAGE: node postman_collection.server.js [filpath=postman_collection.json]
//
// TODO Handle cookie, multiple responses, request body/headers/params.
// TODO Handle code != 200, rewrite, 404.
// TODO Get port, logging, options from command line.
// TODO Validate to schema, report route conflicts & issues.
// TODO Publish as CLI package.
// TODO To TypeScript.

const express = require('express');
const fs = require('fs');

const args = process.argv.slice(2);

const app = express();

const postmanCollectionPath = args[0] || 'postman_collection.json';
const postmanCollection = JSON.parse(
    fs.readFileSync(postmanCollectionPath)
);

const port = 3000;

// Set response headers from postman collection 'header' array.
function setResponseHeaders(res, headers) {
    (headers || []).map((header) => {
        console.info('header', header.key, header.value);
        res.setHeader(header.key, header.value);
    });
}

// Resolve CORS and allow common response headers.
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-type,Origin,Accept,Authorization');
    res.setHeader('Access-Control-Max-Age', '3600');
    next();
});

// Create each route and handler.
postmanCollection.item.forEach((item, itemIndex) => {
    const name = item.name;
    const method = item.request.method;
    console.info('Evaluate', itemIndex, method, name);
    const requestPath = item.request.url.path;
    const response = item.response[0];
    if (response === undefined) {return;}
    const { code, body, header } = response;
    if (requestPath && code === 200 && body) {
        const route = '/' + requestPath.join('/');
        console.info(itemIndex, method, route);
        const handler = (req, res) => {
            console.info('Serve', method, route);
            setResponseHeaders(res, header);
            res.send(body);
        };
        switch (method) {
            case 'GET':
                app.get(route, handler);
                break;
            case 'POST':
                app.post(route, handler);
                break;
            case 'PUT':
                app.put(route, handler);
                break;
            case 'PATCH':
                app.patch(route, handler);
                break;
            case 'DELETE':
                app.delete(route, handler);
                break;
            default:
                console.error(method, route, 'Cannot handle');
                break;
        }
    }
});

// Start server on port.
app.listen(port, () => {
  console.info(`Listening at http://localhost:${port}`);
});
