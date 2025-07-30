
import express, { Express, Request, Response } from 'express';
import http from 'http';
import { initSocket } from './socket';
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
import reviewRoutes from './routes/review.routes';
import chatRoutes from './routes/chat.routes';
import itemRequestRoutes from './routes/item-request.routes';
import adminRoutes from './routes/admin.routes';
import reportRoutes from './routes/report.routes';

dotenv.config();

connectDB();

const app: Express = express();
const server = http.createServer(app);
initSocket(server);
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
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/item-requests', itemRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/report', reportRoutes);


app.get('/api', (req: Request, res: Response) => {
  res.send('LendLocal API is running...');
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});