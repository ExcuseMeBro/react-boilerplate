import { useTranslation } from "react-i18next";

export function RouteLoading() {
  const { t } = useTranslation();
  return (
    <p className="mx-auto max-w-6xl px-4 py-4" role="status">
      {t("route.loading")}
    </p>
  );
}

export function RouteError() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-14">
      <p role="alert">{t("route.error")}</p>
      <p>
        <a className="underline" href="">
          {t("route.reload")}
        </a>
        {" · "}
        <a className="underline" href="/">
          {t("nav.home")}
        </a>
      </p>
    </main>
  );
}
