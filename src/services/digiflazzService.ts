import axios from "axios";
import crypto from "crypto";

import prisma from "../prisma";

const DIGIFLAZZ_USERNAME = process.env.DIGIFLAZZ_USERNAME || "";
const DIGIFLAZZ_API_KEY = process.env.DIGIFLAZZ_API_KEY || "";

export const getPriceList = async () => {
  const sign = crypto
    .createHash("md5")
    .update(DIGIFLAZZ_USERNAME + DIGIFLAZZ_API_KEY + "pricelist")
    .digest("hex");

  const body = {
    cmd: "prepaid",
    username: DIGIFLAZZ_USERNAME,
    sign,
  };

  const digiflazApi = "https://api.digiflazz.com/v1/price-list";

  const response = await axios.post(digiflazApi, body, {
    headers: { "Content-Type": "application/json" },
  });

  return response.data;
};

export const createOrder = async (
  buyerSkuCode: string,
  customerNo: string,
  refId: string
) => {
  const sign = crypto
    .createHash("md5")
    .update(DIGIFLAZZ_USERNAME + DIGIFLAZZ_API_KEY + refId)
    .digest("hex");

  const body = {
    username: DIGIFLAZZ_USERNAME,
    buyer_sku_code: buyerSkuCode, // kode produk
    customer_no: customerNo, // nomor tujuan (hp / id pelanggan)
    ref_id: refId, // unique id transaksi (wajib unik)
    sign,
  };

  const digiflazzApi = "https://api.digiflazz.com/v1/transaction";
  const response = await axios.post(digiflazzApi, body, {
    headers: { "Content-Type": "application/json" },
  });

  return response.data;
};

export async function handleDigiflazzWebhook(payload: any) {
  if (!payload.ref_id) {
    throw new Error("Invalid payload: missing ref_id");
  }

  const trx = await prisma.transactionDigiflazz.findUnique({
    where: { refId: payload.ref_id },
  });

  if (!trx) {
    throw new Error("Transaction not found");
  }

  return prisma.transactionDigiflazz.update({
    where: { refId: payload.ref_id },
    data: {
      status: payload.status?.toUpperCase() || "UNKNOWN",
      sn: payload.sn || "",
      rawResponse: JSON.stringify(payload),
      updatedAt: new Date(),
    },
  });
}
