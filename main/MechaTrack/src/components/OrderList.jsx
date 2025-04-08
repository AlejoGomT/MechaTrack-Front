import OrderCard from "./OrderCard";

const OrderList = ({ orders }) => {
  return (
    <>
      {orders.length > 0 ? (
        orders.map((order) => <OrderCard key={order.id} {...order} />)
      ) : (
        <p>No hay órdenes que coincidan con los filtros seleccionados.</p>
      )}
    </>
  );
};

export default OrderList;
