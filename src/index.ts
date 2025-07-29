
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import passport from 'passport';
import './config/passport'; 
import authRoutes from './routes/auth.routes';
import communityRoutes from './routes/community.routes';
import cookieParser from 'cookie-parser';
import itemRoutes from './routes/item.routes';
import borrowRoutes from './routes/borrow.routes';

dotenv.config();

connectDB();

const app: Express = express();
const PORT = process.env.PORT || 8080;


app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/borrow', borrowRoutes);


app.get('/api', (req: Request, res: Response) => {
  res.send('LendLocal API is running...');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});