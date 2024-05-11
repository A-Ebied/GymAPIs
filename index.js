const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

// app.use(express.static("public"));
app.use(express.json());

// MiddleWare is Unique Member
const isUniqueMwmber = (req, res, next) => {
  let nationalId = +req.body.nationalId;
  let members = JSON.parse(fs.readFileSync("members.json", "utf-8"));
  let index = members.findIndex((member) => {
    member.nationalId === nationalId;
  });
  if (index === -1) {
    next();
  } else {
    res.json({ message: " Member is already there ..." });
  }
};

// Middleware to check if trainer id exists
const checkTrainerId = (req, res, next) => {
  const { id } = req.params;
  let trainers = JSON.parse(fs.readFileSync("trainers.json", "utf-8"));
  const index = trainers.findIndex((tr) => tr.id === +id);
  if (index === -1) {
    res.status(404).json({ message: "Trainers is Not Found ..!" });
  } else {
    next();
  }
};

// Middlware check if member id exists && if member deleted softly

const checkMemberEx = (req, res, next) => {
  const { id } = req.params;
  let members = JSON.parse(fs.readFileSync("members.json", "utf-8"));
  const index = members.findIndex((mem) => mem.id === +id);
  let isDeleted = false;
  isDeleted = members[index].deleted;
  if (index === -1 || isDeleted) {
    res.status(404).json({ message: "Member is Not Found ..!" });
  } else {
    next();
  }
};

//? ******************************* Statistics APIs **********************************************
//Get all revenues of all members.  //! True
app.get("/membersrevenues", (req, res) => {
  let members = JSON.parse(fs.readFileSync("members.json", "utf-8"));
  let total = 0;
  total = members.reduce((acc, mem) => acc + mem.membership.cost, 0);
  res.json({ "total revenues is : ": total });
});

//Get the revenues of a specific trainer //! True
app.get("/trainersrevenues/:id", checkTrainerId, (req, res) => {
  let members = JSON.parse(fs.readFileSync("members.json", "utf-8"));
  let trainersMember = members.filter(
    (mem) => mem.trainerId === +req.params.id
  );
  let total = trainersMember.reduce((acc, mem) => acc + mem.membership.cost, 0);
  res.json({ "Trainer total revenues is : ": total });
});

//? ************************************* Trainer's APIs *******************************************

//Get all trainers and trainer’s members. //! True

app.get("/trainers", (req, res) => {
  let members = JSON.parse(fs.readFileSync("members.json", "utf-8"));
  let trainers = JSON.parse(fs.readFileSync("trainers.json", "utf-8"));
  let trainersWithMembers = trainers.map((trainer) => {
    let trainersMember = members.filter((member) => {
      member.trainerId === trainer.id;
    });
    trainer.member = trainersMember.map((tm) => [tm.name, tm.membership]);
    return trainer;
  });

  res.json(trainersWithMembers);
});

//Get a specific trainer and trainer’s members  //! True
app.get("/trainers/:id", checkTrainerId, (req, res) => {
  let members = JSON.parse(fs.readFileSync("members.json", "utf-8"));
  let trainers = JSON.parse(fs.readFileSync("trainers.json", "utf-8"));
  let idx = trainers.findIndex((t) => t.id === +req.params.id);
  let trainerMembers = members.filter(
    (member) => member.trainerId === trainers[idx].id
  );
  trainers[idx].members = trainerMembers.map((t) => [t.name, t.membership]);
  let trainersWithMembers = trainers[idx];
  res.json(trainersWithMembers);
});

//Add a trainer.  //! True
app.post("/trainers", (req, res) => {
  let trainers = JSON.parse(fs.readFileSync("trainers.json", "utf-8"));
  req.body.id = trainers.length + 1;
  trainers.push(req.body);
  fs.writeFileSync("trainers.json", JSON.stringify(trainers));
  res.status(201).json({ message: "CREATE" });
});
//Update trainer. //! True
app.put("/trainers/:id", checkTrainerId, (req, res) => {
  let trainers = JSON.parse(fs.readFileSync("trainers.json", "utf-8"));
  let index = trainers.findIndex((t) => t.id === +req.params.id);
  trainers[index] = req.body;
  fs.writeFileSync("trainers.json", JSON.stringify(trainers));
  res.json({ message: "UPDATE" });
});
//Delete trainer. //! True
app.delete("/trainers/:id", checkTrainerId, (req, res) => {
  let trainers = JSON.parse(fs.readFileSync("trainers.json", "utf-8"));
  let index = trainers.findIndex((trainer) => {
    trainer.id === +req.params.id;
  });
  trainers.splice(index, 1);
  fs.writeFileSync("trainers.json", JSON.stringify(trainers));
  res.json({ message: "DELETE" });
});

//? ************************************* Member APIs *********************************************

// Get all Members and Member’s Trainer  //! True
app.get("/members", (req, res) => {
  let members = JSON.parse(fs.readFileSync("members.json", "utf-8"));
  let trainers = JSON.parse(fs.readFileSync("trainers.json", "utf-8"));
  trainersWithMembers = members.map((member) => {
    let memberTrainer = trainers.filter(
      (trainer) => trainer.id === member.trainerId
    );
    member.trainer = memberTrainer;
    return member;
  });
  res.json(trainersWithMembers);
});

//Get a specific Member  //! True
app.get("/members/:id", checkMemberEx, (req, res) => {
  let members = JSON.parse(fs.readFileSync("members.json", "utf-8"));
  index = members.findIndex((member) => member.id === +req.params.id);
  let today = new Date();
  let startDate = new Date(members[index].membership.from);
  let endDate = new Date(members[index].membership.to);
  if (today > startDate && today < endDate) {
    res.json(members[index]);
  } else {
    res.json({ message: "This Member Is Not Allowed To Enter The Gym" });
  }
});
//Add a member.  //! True
app.post("/members", isUniqueMwmber, (req, res) => {
  let members = JSON.parse(fs.readFileSync("members.json", "utf-8"));
  req.body.id = members.length + 1;
  members.push(req.body);
  fs.writeFileSync("members.json", JSON.stringify(members));
  res.status(201).json({ message: "CREATE" });
});
//Update members.  //! True
app.put("/members/:id", checkTrainerId, (req, res) => {
  let members = JSON.parse(fs.readFileSync("members.json", "utf-8"));
  let index = members.findIndex((mem) => mem.id === +req.params.id);
  members[index].name = req.body.name;
  members[index].membership = req.body.membership;
  members[index].trainerId = req.body.trainerId;
  fs.writeFileSync("members.json", JSON.stringify(members));
  res.status(200).json({ message: "UPDATE" });
});

//Delete member.
app.delete("/members/:id", checkMemberEx, (req, res) => {
  let members = JSON.parse(fs.readFileSync("members.json", "utf-8"));
  let index = members.findIndex((mem) => mem.id === +req.params.id);
  members[index].deleted = true;
  members[index].membership.cost = 0;
  fs.writeFileSync("members.json", JSON.stringify(members));
  res.json({ message: "DELETE" });
});

app.listen(3000, () => {
  console.log("Server running....");
});
