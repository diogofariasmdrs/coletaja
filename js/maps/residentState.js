export const residentKey = "coletaja.resident.v1";
export function readPreferences(storage) {
  try {
    const data = JSON.parse(storage.getItem(residentKey));
    return {
      minutes: [5, 15, 30].includes(data?.minutes) ? data.minutes : 0,
    };
  } catch {
    return { minutes: 0 };
  }
}
// Um aviso por consulta/veículo e limiar. Pausar não rearma; trocar a consulta ou reiniciar rearma.
export function createArrivalAlert() {
  let identity = "",
    sent = false;
  return {
    reset() {
      identity = "";
      sent = false;
    },
    check(result, minutes, pointKey) {
      const next = [pointKey, result.vehicle, minutes].join("|");
      if (next !== identity) {
        identity = next;
        sent = false;
      }
      if (
        !minutes ||
        sent ||
        result.status !== "arriving" ||
        !Number.isFinite(result.wallSeconds) ||
        result.wallSeconds > minutes * 60
      )
        return false;
      sent = true;
      return true;
    },
  };
}
export function statusLabel(status) {
  return status === "Em coleta" ? "Recolhendo resíduos" : status;
}
