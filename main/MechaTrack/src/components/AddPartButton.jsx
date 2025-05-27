import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import PartsModal from "./PartsModal";
import { CustomButton } from "../styles/GlobalStyles";
import { getParts } from "../services/partService";
import { getOrderById } from "../services/orderService";

const AddPartButton = ({
  orderId,
  userId,
  partsList,
  setPartsList,
  isFinalized,
}) => {
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [availableParts, setAvailableParts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("Props recibidos en AddPartButton:", {
      orderId,
      userId,
      partsList,
      isFinalized,
    });
    const fetchAvailableParts = async () => {
      if (!orderId) {
        console.log(
          "No orderId proporcionado, estableciendo availableParts como vacío"
        );
        setAvailableParts([]);
        return;
      }
      setIsLoading(true);
      try {
        // Obtener datos de la orden
        console.log("Obteniendo datos de la orden con ID:", orderId);
        const orderData = await getOrderById(orderId);
        console.log("Datos de la orden recibidos:", orderData);
        const { vehicle_economic_number, branch, model } = orderData;
        if (!vehicle_economic_number || !branch || !model) {
          throw new Error(
            "Faltan datos del vehículo en la orden (economic_number, branch o model)"
          );
        }

        // Obtener repuestos disponibles basados en el modelo
        const partsResponse = await getParts(model);
        const partsData = partsResponse.parts || [];
        if (!Array.isArray(partsData) || partsData.length === 0) {
          throw new Error(
            "No se encontraron repuestos para el modelo del vehículo"
          );
        }
        setAvailableParts(partsData);
      } catch (err) {
        console.error("Error al cargar repuestos disponibles:", err);
        toast.error(err.message || "Error al cargar repuestos disponibles");
        setAvailableParts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableParts();
  }, [orderId]);

  const handleOpenModal = () => {
    if (!orderId) {
      toast.error("No se puede abrir el modal: falta el ID de la orden");
      return;
    }
    setShowPartsModal(true);
  };

  return (
    <>
      <CustomButton
        onClick={handleOpenModal}
        className="mt-3"
        disabled={isLoading || !orderId}
      >
        <FontAwesomeIcon icon={faPlus} />{" "}
        {isLoading ? "Cargando..." : "Añadir Repuesto"}
      </CustomButton>
      <PartsModal
        showPartsModal={showPartsModal}
        setShowPartsModal={setShowPartsModal}
        showPartsManagementModal={false}
        setShowPartsManagementModal={() => {}}
        partsList={partsList}
        setPartsList={setPartsList}
        availableParts={availableParts}
        orderId={orderId}
        isReadOnly={false}
        userId={userId}
        isFinalized={isFinalized}
      />
    </>
  );
};

export default AddPartButton;
