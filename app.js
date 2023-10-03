const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStateQuery = `SELECT * FROM state ;`;
  const stateArray = await db.all(getStateQuery);
  response.send(
    stateArray.map((eachItem) => convertDbObjectToResponseObject(eachItem))
  );
});
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getAStateQuery = `SELECT * FROM state WHERE state_id=${stateId};`;
  const stateS = await db.get(getAStateQuery);
  response.send(convertDbObjectToResponseObject(stateS));
});
app.post("/districts/", async (request, response) => {
  //const { stateId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postStateQuery = `
    INSERT INTO
        district (district_name,state_id,cases,cured,active,deaths)
    VALUES
        ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const district = await db.run(postStateQuery);
  response.send("District Successfully Added");
});
const convērtDbToResponse = (dataObject) => {
  return {
    districtId: dataObject.district_id,
    districtName: dataObject.district_name,
    stateId: dataObject.state_id,
    cases: dataObject.cases,
    cured: dataObject.cured,
    active: dataObject.active,
    deaths: dataObject.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id=${districtId};`;
  const result = await db.get(getDistrictQuery);
  response.send(convērtDbToResponse(result));
});
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictAndQuery = `DELETE FROM district WHERE district_id=${districtId};`;
  await db.run(deleteDistrictAndQuery);
  response.send("District Removed");
});
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const putDistrictQuery = `
    UPDATE 
        district
    SET
        district_name= '${districtName}',
        state_id= ${stateId},
        cases= ${cases},
        cured= ${cured},
        active= ${active},
        deaths= ${deaths} 
    WHERE district_id=${districtId};`;
  await db.run(putDistrictQuery);
  response.send("District Details Updated");
});
app.get("states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
     SELECT
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths),
    FROM 
        district
    WHERE 
        state_id=${stateId};
     `;
  const stats = await db.get(getStateStatsQuery);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

const convertDbDataToResponseObject = (dataItem) => {
  return {
    stateName: dataItem.state_name,
  };
};
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetails = `
    SELECT
        state_name 
    FROM 
        district
    WHERE 
        district_id=${districtId};`;
  const details = await db.get(getDistrictDetails);
  response.send(
    details.map((eachItem) => convertDbDataToResponseObject(eachItem))
  );
});
module.exports = app;
