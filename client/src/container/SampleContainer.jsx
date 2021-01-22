import Sample from 'Comps/sample';
import withHooks from 'Utils/withHooks';
import { useOrderApi } from '../_stores/bcStore/bcStore';

const mapHooksToProps = () => {
  const { onClickAction, state } = useOrderApi();
  return {
    orders: state.orders,
    onClick: onClickAction,
  };
};

export default withHooks(mapHooksToProps)(Sample);
