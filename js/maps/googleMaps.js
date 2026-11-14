let loading;
export function loadMaps(key) {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    function fail() {
      clearTimeout(timer);
      script.remove();
      delete window.initColetaMap;
      loading = undefined;
      reject(new Error("Maps indisponível"));
    }
    const timer = setTimeout(fail, 18000);
    window.initColetaMap = () => {
      clearTimeout(timer);
      delete window.initColetaMap;
      resolve();
    };
    window.gm_authFailure = () => {
      window.dispatchEvent(new Event("coleta-map-error"));
      fail();
    };
    script.onerror = fail;
    script.async = true;
    const query = new URLSearchParams({
      key,
      callback: "initColetaMap",
      loading: "async",
      libraries: "marker",
      language: "pt-BR",
      region: "BR",
      v: "quarterly",
    });
    script.src = "https://maps.googleapis.com/maps/api/js?" + query;
    document.head.appendChild(script);
  });
  return loading;
}
