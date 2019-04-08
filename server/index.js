const app = require('./app')
const port = parseInt(process.argv[2]) || 8080

app.listen(port, () => console.log(`Server running on port ${port}...`))
