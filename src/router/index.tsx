import { createBrowserRouter } from 'react-router-dom';
import App from '../App.tsx';
import Todo from '../pages/Todo.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/todo',
    element: <Todo />,
  },
]);
