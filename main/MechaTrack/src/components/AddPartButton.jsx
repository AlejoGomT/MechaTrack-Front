import { useState, useEffect, useCallback } from "react";
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
  const [totalParts, setTotalParts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleModel, setVehicleModel] = useState(null);
  const partsLimit = 10;

  // Memoizar fetchParts para evitar referencias nuevas en cada renderizado
  const fetchParts = useCallback(
    async (page = 1) => {
      if (!vehicleModel) {
        console.log(
          "Modelo del vehículo no disponible, omitiendo carga de repuestos"
        );
        setAvailableParts([]);
        setTotalParts(0);
        return;
      }
      setIsLoading(true);
      try {
        console.log(
          "Cargando repuestos para modelo:",
          vehicleModel,
          "página:",
          page
        );
        const partsResponse = await getParts(vehicleModel, page, partsLimit);
        const partsData = partsResponse.parts || [];
        if (!Array.isArray(partsData)) {
          throw new Error("La respuesta de repuestos no es un arreglo válido");
        }
        // Evitar actualizaciones redundantes comparando con el estado actual
        setAvailableParts((prev) =>
          JSON.stringify(prev) === JSON.stringify(partsData) ? prev : partsData
        );
        setTotalParts((prev) =>
          prev === partsResponse.total ? prev : partsResponse.total || 0
        );
        console.log(
          "Repuestos cargados:",
          partsData,
          "Total:",
          partsResponse.total
        );
      } catch (err) {
        console.error(
          "[AddPartButton] Error al cargar repuestos disponibles:",
          err
        );
        toast.error(err.message || "Error al cargar repuestos disponibles");
        setAvailableParts([]);
        setTotalParts(0);
      } finally {
        setIsLoading(false);
      }
    },
    [vehicleModel, partsLimit]
  );

  // Obtener el modelo del vehículo
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        console.log(
          "No orderId proporcionado, estableciendo availableParts como vacío"
        );
        setAvailableParts([]);
        setTotalParts(0);
        return;
      }
      setIsLoading(true);
      try {
        console.log("Obteniendo datos de la orden con ID:", orderId);
        const orderData = await getOrderById(orderId);
        console.log("Datos de la orden recibidos:", orderData);
        const { vehicle_economic_number, branch, model } = orderData;
        if (!vehicle_economic_number || !branch || !model) {
          throw new Error(
            "Faltan datos del vehículo en la orden (economic_number, branch o model)"
          );
        }
        setVehicleModel(model);
      } catch (err) {
        console.error(
          "[AddPartButton] Error al cargar datos de la orden:",
          err
        );
        toast.error(err.message || "Error al cargar datos de la orden");
        setAvailableParts([]);
        setTotalParts(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  // Cargar repuestos iniciales cuando cambie el modelo
  useEffect(() => {
    if (vehicleModel) {
      fetchParts(1);
    }
  }, [vehicleModel, fetchParts]);

  const handleOpenModal = () => {
    if (!orderId) {
      toast.error("No se puede abrir el modal: falta el ID de la orden");
      return;
    }
    if (!vehicleModel) {
      toast.error("No se puede abrir el modal: falta el modelo del vehículo");
      return;
    }
    setShowPartsModal(true);
  };

  return (
    <>
      <CustomButton
        onClick={handleOpenModal}
        className="mt-3"
        disabled={isLoading || !orderId || !vehicleModel}
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
        fetchParts={fetchParts}
        totalParts={totalParts}
        partsLimit={partsLimit}
      />
    </>
  );
};

export default AddPartButton;
