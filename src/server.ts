import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.PORT) || 3000;
const nodeEnv = process.env.NODE_ENV || "development";

app.listen(port, () => {
  console.log(`CampusHub API running on port ${port}`);
  console.log(`Environment: ${nodeEnv}`);
});