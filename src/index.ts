
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';





dotenv.config();

connectDB();

const app: Express = express();
const PORT = process.env.PORT || 8080;


app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/api', (req: Request, res: Response) => {
  res.send('LendLocal API is running...');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});