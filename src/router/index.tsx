import { createBrowserRouter } from 'react-router-dom';
import HomePage from '@/App';
import DefaultLayout from '@/layouts/Default';
import AnimationPage from '@/pages/Animation';
import TodoPage from '@/pages/Todo';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DefaultLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'todos',
        element: <TodoPage />,
      },
      {
        path: 'animation',
        element: <AnimationPage />,
      },
    ],
  },
]);
