import Default from '@/layouts/Default.tsx';
import { useAppDispatch, useTypedSelector } from '@/store';
import { CounterServices } from '@/reducers/CounterSlice';
export default function Todo() {
  const dispatch = useAppDispatch();
  const count = useTypedSelector((state) => state.Counter.count);

  const increment = () => {
    dispatch(CounterServices.actions.incrementNumber());
  };
  return (
    <Default>
      <p className="text-3xl text-red-500">Todos pages</p>
      <button
        onClick={() => increment()}
        className="pointer-events-auto ml-8 rounded-md bg-indigo-600 px-3 py-2 text-[0.8125rem] font-semibold leading-5 text-white hover:bg-indigo-500">
        Count {count}
      </button>
    </Default>
  );
}
