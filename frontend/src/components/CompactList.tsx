import { Button } from "@heroui/react";
import { useState, type ReactNode } from "react";
import { useLanguage } from "../i18n";
import { FormInput, FormSelect } from "./ui";

export type ListFilterOption = { value: string; label: string };

export function CompactList<T>({
  items,
  getKey,
  getStatus,
  getSearchText,
  statusOptions,
  renderItem,
  searchLabel,
  emptyMessage,
  filtersReady = true,
  filterLabel = "按状态筛选",
  allLabel = "全部状态",
}: {
  items: T[];
  getKey: (item: T) => string;
  getStatus: (item: T) => string;
  getSearchText: (item: T) => string;
  statusOptions: ListFilterOption[];
  renderItem: (item: T) => ReactNode;
  searchLabel: string;
  emptyMessage: string;
  filtersReady?: boolean;
  filterLabel?: string;
  allLabel?: string;
}) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredItems = items.filter((item) => {
    const matchesSearch = getSearchText(item)
      .toLocaleLowerCase()
      .includes(normalizedSearch);
    return matchesSearch && (status === "all" || getStatus(item) === status);
  });
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <FormInput
          aria-label={t(searchLabel)}
          className="min-w-0 flex-1"
          placeholder={t(searchLabel)}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <FormSelect
          label={t(filterLabel)}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[{ value: "all", label: t(allLabel) }, ...statusOptions]}
          className="w-full sm:w-44"
          isDisabled={!filtersReady}
        />
      </div>

      {pageItems.length ? (
        <ul className="space-y-2">
          {pageItems.map((item) => (
            <li key={getKey(item)}>{renderItem(item)}</li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          {t(filteredItems.length ? "当前页没有条目。" : emptyMessage)}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>{t("共 {count} 项", { count: filteredItems.length })}</span>
        <div className="flex items-center gap-2">
          <span>{t("第 {page} / {pages} 页", { page: currentPage, pages: pageCount })}</span>
          <Button
            size="sm"
            variant="outline"
            isDisabled={currentPage <= 1}
            onPress={() => setPage(currentPage - 1)}
          >
            {t("上一页")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            isDisabled={currentPage >= pageCount}
            onPress={() => setPage(currentPage + 1)}
          >
            {t("下一页")}
          </Button>
        </div>
      </div>
    </div>
  );
}
