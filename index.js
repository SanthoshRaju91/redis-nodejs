const express = require('express')
const axios = require('axios')
const redis = require('redis')

const app = express()
const PORT = process.env.PORT || 5000
const client = redis.createClient({
  host: '192.168.0.165',
  port: '49153'
})

client.flushall(() => {
  console.log("Cache Db flushed!!!")
})

client.on('error', err => {
  console.log(err)
})

app.get('/jobs', async (req, res) => {
  const searchTerm = req.query.search

  try {
    client.get(searchTerm, async (err, jobs) => {
      if (err) throw err

      if (jobs) {
        console.log("Serving response from cache")
        res.status(200).send({
          jobs: JSON.parse(jobs),
        })
      } else {
        const jobs = await axios.get(`https://jobs.github.com/positions.json?search=${searchTerm}`)
        client.setex(searchTerm, 600, JSON.stringify(jobs.data))

        console.log("Serving response from API endpoint")
        res.status(200).send({
          jobs: jobs.data
        })
      }
    })
  } catch (err) {
    res.status(500).send({message: err.message})
  }
})

app.listen(PORT, () => {
  console.log('> Server started on port: ' + PORT)
})

