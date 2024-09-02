// import { Router } from "express";
// import { getListSizesController } from "./useCases/GetListSizes";
// import { getListFillingsController } from "./useCases/GetListFillings";
// import { makeDevicesController } from "./useCases/Devices";
// import { isAllowed, onlyOperator } from "./utils/auth";
// import { isAllowed, onlyOperator } from "./_routes";

// const router = Router()
// const devicesController = makeDevicesController();

// router.get('/devices', isAllowed, onlyOperator, devicesController.getAll);

// router.get('/sizes', (request, response) => {
//   return getListSizesController.handle(request, response);
// });

// router.get('/fillings', (request, response) => {
//   return getListFillingsController.handle(request, response);
// });

// export { router }