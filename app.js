const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

// Handle form submissions
app.post('/submit-form', (req, res) => {
  const { name = '', email = '', tasks = '' } = req.body;

  if (!name || !email || !tasks) {
    return res.status(400).send('All fields are required');
  }

  const entry = `<br>Name: ${name}<br>Email: ${email}<br>Tasks: ${tasks}<br>`;
  fs.appendFile('data.txt', entry, (err) => {
    if (err) {
      return res.status(500).send('Error saving data');
    }
    res.redirect('/services');
  });
});

// Delete a single task by index
app.post('/delete/:index', (req, res) => {
  const indexToDelete = parseInt(req.params.index);

  fs.readFile('data.txt', 'utf-8', (err, rawData) => {
    if (err) return res.status(500).send('Error reading data');

    const entries = rawData
      .split('<br>')
      .filter(e => e.trim() !== '')
      .reduce((acc, curr, idx) => {
        const blockIdx = Math.floor(idx / 3);
        if (!acc[blockIdx]) acc[blockIdx] = [];
        acc[blockIdx].push(curr);
        return acc;
      }, []);

    if (indexToDelete < 0 || indexToDelete >= entries.length) {
      return res.status(400).send('Invalid task index');
    }

    entries.splice(indexToDelete, 1);

    const updatedData = entries
      .map(entry => `<br>${entry.join('<br>')}<br>`)
      .join('');

    fs.writeFile('data.txt', updatedData, (err) => {
      if (err) return res.status(500).send('Error deleting task');
      res.redirect('/services');
    });
  });
});

// Show services/submissions page
app.get('/services', (req, res) => {
  fs.readFile('data.txt', 'utf-8', (err, rawData) => {
    if (err) {
      return res.send('Error reading data');
    }

    const entries = rawData
      .split('<br>')
      .filter(e => e.trim() !== '')
      .reduce((acc, curr, idx) => {
        const blockIdx = Math.floor(idx / 3);
        if (!acc[blockIdx]) acc[blockIdx] = [];
        acc[blockIdx].push(curr);
        return acc;
      }, []);

    const entryCards = entries.map((entry, index) => `
      <div class="card">
        ${entry.map(line => `<p>${line}</p>`).join('')}
        <form action="/delete/${index}" method="POST" onsubmit="return confirm('Delete this task?');">
          <button style="
            background-color: #c00;
            color: white;
            border: none;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 14px;
            margin-top: 10px;
            cursor: pointer;
          ">Delete</button>
        </form>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Services</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: "Segoe UI", sans-serif;
            background-color: #f0f0f0;
            padding: 40px 20px;
            text-align: center;
          }
          h1 {
            color: #007BFF;
          }
          .nav {
            margin-bottom: 20px;
          }
          .nav a {
            margin: 0 10px;
            text-decoration: none;
            color: #007BFF;
            font-weight: bold;
          }
          .nav a:hover {
            color: #0056b3;
          }
          .card {
            background: #fff;
            padding: 20px;
            border-radius: 10px;
            margin: 15px auto;
            max-width: 500px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: left;
          }
          .card p {
            margin: 5px 0;
            color: #333;
          }
          .delete-all {
            margin-bottom: 25px;
          }
        </style>
      </head>
      <body>
        <h1>All Submissions</h1>
        <div class="nav">
          <a href="/">Home</a>
          <a href="/contact">Contact</a>
        </div>


        ${entryCards || "<p>No submissions yet.</p>"}
      </body>
      </html>
    `;
    res.send(html);
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
