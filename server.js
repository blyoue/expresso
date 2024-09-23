const bodyParser = require('body-parser');
const cors = require('cors');
const errorhandler = require('errorhandler');
const morgan = require('morgan');
const express = require('express');
const apiRouter = require('./api/api');


const app = express();
const PORT = process.env.PORT || 4000;

app.use(morgan('dev'), bodyParser.json(), errorhandler(), cors()); 
app.use('/api', apiRouter);
app.listen(PORT, () => {
    console.log(`The server is listening on port ${PORT}`);
});

module.exports = app;