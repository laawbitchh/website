const fs = require("fs"),
  express = require("express"),
  app = express(),
  cors = require("cors"),
  path = require("path");
(mongoose = require("mongoose")),
  (mongoUri =
    "mongodb+srv://laaw:mongoDatabase@cluster0.gsmtxwa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"),
  (modalMessage = require("./models/message.model"));

app.use(
  require("body-parser").urlencoded({
    extended: true,
  })
);
app.use(cors());
app.use(require("body-parser").json());

const loadEndpoints = (path = "./routes") => {
  fs.readdirSync(path).forEach((dirs) => {
    const dir = fs
      .readdirSync(`${path}/${dirs}`)
      .filter((files) => files.endsWith(".js"));
    for (const files of dir) {
      const file = require(`${path}/${dirs}/${files}`);
      switch (file.method) {
        case "get":
          app.get(`/api${file.endpoint}`, async (req, res) => {
            await file.exec(req, res);
          });
          console.log(file.endpoint);
          break;
        case "post":
          app.post(`/api${file.endpoint}`, async (req, res) => {
            await file.exec(req, res);
          });
          console.log(file.endpoint);
          break;
      }
    }
  });
};

const loadApi = (port) => {
  app.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });
};

const loadDatabase = async (url) => {
  mongoose
    .connect(url, {})
    .then(() => console.log("Database connected!"))
    .catch((err) => console.log(err));
};

const loadWsServer = () => {
  const server = require("http").Server(app),
    ws = require("ws"),
    wss = new ws.Server({ server }),
    clients = [];

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      let data = JSON.parse(message);
      console.log(data.event);
      if (data.event == "connection") {
        if (data.from == "Jess") {
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === ws.OPEN) {
              let msg = {
                event: "ownerConnection",
              };
              client.send(JSON.stringify(msg));
            }
          });
        }
        clients[data.from] = ws;
        // console.log(`New connection ${data.from}`);
      }

      if (data.event == "msg") {
        new modalMessage({
          from: data.from,
          to: data.to,
          content: data.content,
          sendAt: data.sendAt,
        }).save();

        if (clients[data.to]) {
          if (clients[data.to].readyState === ws.OPEN) {
            clients[data.to].send(JSON.stringify(data));
          }
        }
      }

      if (data.event == "deconnection") {
        if (data.from == "Jess") {
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === ws.OPEN) {
              let msg = {
                event: "ownerDeconnection",
              };
              client.send(JSON.stringify(msg));
            }
          });
        }

        delete clients[data.from];
      }

      if (data.event == "ownConnection") {
        if (clients["Jess"]) {
          let msg = {
            event: "ownConnection",
            data: true,
          };
          clients[data.from].send(JSON.stringify(msg));
        } else {
          let msg = {
            event: "ownConnection",
            data: false,
          };
          clients[data.from].send(JSON.stringify(msg));
        }
      }
    });

    ws.on("close", (m) => {});
  });

  server.listen(3001);
};

const loadPages = () => {
  app.use(express.static(path.join(__dirname, "../public")));

  app.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/pages/home.html"));
  });

  app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/pages/login.html"));
  });

  app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/pages/register.html"));
  });

  app.get("/panel", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/pages/panel.html"));
  });

  app.get("/chat", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/pages/chat.html"));
  });

  app.get("/panel-chat/:username", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/pages/panel-chat.html"));
  });

  app.get("/jess", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/pages/jess.html"));
  });
};

console.clear();
loadApi("3000");
loadEndpoints();
loadDatabase(mongoUri);
loadWsServer();
loadPages();
