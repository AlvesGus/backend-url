import express from 'express'
import cors from 'cors'
import { prisma } from '../lib/prisma.js'

const app = express()
app.use(express.json())
app.use(
  cors({
    origin: 'http://localhost:3000',
    allowedHeaders: ['Content-Type', 'Authorization'],
    AccessControlAllowOrigin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'DELETE']
  })
)

const generateShortUrl = () => {
  let shortUrl = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength)
    shortUrl += characters.charAt(randomIndex)
  }
  return shortUrl
}

app.get('/', async (req, res) => {
  res.send('Server is running')
})

app.get('/url/get/:hash', async (req, res) => {
  const { hash } = req.params
  if (!hash) {
    return res.status(400).send('Error: Hash parameter is missing')
  }
  try {
    const urlRecord = await prisma.url.findUnique({
      where: {
        hash: hash
      }
    })

    if (urlRecord) {
      return res.redirect(urlRecord.url_original)
    } else {
      return res.status(404).send('Short URL not found')
    }
  } catch (error) {
    console.error('Error fetching URL by hash:', error)
    return res.status(500).send('Error fetching URL')
  }
})

app.get('/url/get-all', async (req, res) => {
  try {
    const url = await prisma.url.findMany()
    return res.status(200).send(url) // Use 200 for successful retrieval
  } catch (error) {
    console.error('Error fetching all URLs:', error)
    return res.status(500).send('Error fetching URLs')
  }
})

app.post('/url/create', async (req, res) => {
  const { url_original } = req.body
  const hash = generateShortUrl()
  const base_url = 'https://backend-url-six.vercel.app/'

  if (!url_original) {
    return res.status(400).send('Error: Missing original URL')
  }

  if (!hash) {
    return res.status(500).send('Error generating short URL')
  }

  const url_short = `${base_url}/${hash}`

  try {
    const urlShortner = await prisma.url.create({
      data: {
        url_original,
        hash,
        url_short: url_short
      },
      select: {
        id: true,
        url_original: true,
        hash: true,
        url_short: true
      }
    })
    return res.status(201).send(urlShortner)
  } catch (error) {
    console.error('Error creating short URL:', error)
    return res.status(500).send('Error creating short URL')
  }
})

app.delete('/url/delete/:id', async (req, res) => {
  const { id } = req.params

  try {
    const idExists = await prisma.url.findUnique({
      where: {
        id
      }
    })
    if (!idExists) {
      return res.status(404).send(`Error: URL with ID '${id}' not found`)
    }

    const url = await prisma.url.delete({
      where: {
        id
      }
    })
    return res.status(200).send('URL deleted successfully') // Use 200 for successful deletion
  } catch (error) {
    console.error(`Error deleting URL with ID '${id}':`, error)
    return res.status(500).send('Error deleting URL')
  }
})

app.get('/:hash', async (req, res, next) => {
  const { hash } = req.params

  if (!hash) {
    return res.status(400).send('Error: Hash parameter is missing')
  }

  try {
    const urlRecord = await prisma.url.findUnique({
      where: {
        hash: hash
      }
    })
    if (urlRecord) {
      return res.redirect(urlRecord.url_original)
    } else {
      return res.status(404).send('Short URL not found')
    }
  } catch (error) {
    console.error('Error retrieving URL:', error)
    return res.status(500).send('Error retrieving URL')
  }
})

const PORT = process.env.PORT || 3333
app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT)
})
