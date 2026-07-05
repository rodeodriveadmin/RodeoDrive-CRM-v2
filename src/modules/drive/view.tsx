"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, Trash2, Download, FolderOpen } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { deleteDriveFile, uploadDriveFile } from "./actions";
import "./drive.css";

interface FileRow {
  id: string;
  displayName: string;
  folderPath: string;
  contentType: string | null;
  sizeBytes: number;
  visibility: string;
  ownerEmail: string;
  ownerName: string | null;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DriveView({
  files,
  meEmail,
  isRoot,
}: {
  files: FileRow[];
  meEmail: string;
  isRoot: boolean;
}) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const folders = useMemo(
    () => [...new Set(files.map((f) => f.folderPath))].sort(),
    [files]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((f) => {
      if (folderFilter && f.folderPath !== folderFilter) return false;
      if (!q) return true;
      return f.displayName.toLowerCase().includes(q) || f.folderPath.toLowerCase().includes(q);
    });
  }, [files, query, folderFilter]);

  async function submitUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return;
    setBusy(true);
    setError(null);
    const res = await uploadDriveFile(formData);
    setBusy(false);
    if (res.error) {
      setError(res.error === "TOO_LARGE" ? t("drive.tooLarge") : t("common.error"));
      return;
    }
    formRef.current?.reset();
    setUploadOpen(false);
  }

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={t("drive.title")}
          actions={
            <>
              <Select
                value={folderFilter}
                onChange={(e) => setFolderFilter(e.target.value)}
                className="toolbar-search"
              >
                <option value="">{t("drive.allFolders")}</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
              <Input
                placeholder={t("common.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="toolbar-search"
              />
              <Button onClick={() => { setError(null); setUploadOpen(true); }}>
                <Upload size={16} aria-hidden />
                {t("drive.upload")}
              </Button>
            </>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState message={t("drive.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("drive.file")}</Th>
                <Th>{t("drive.folder")}</Th>
                <Th>{t("drive.size")}</Th>
                <Th>{t("drive.visibility")}</Th>
                <Th>{t("drive.owner")}</Th>
                <Th>{t("common.createdAt")}</Th>
                <Th>{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <Td className="td--strong td--wrap">{f.displayName}</Td>
                  <Td>
                    <span className="drive__folder">
                      <FolderOpen size={13} aria-hidden /> {f.folderPath}
                    </span>
                  </Td>
                  <Td>{formatSize(f.sizeBytes)}</Td>
                  <Td>
                    <Badge tone={f.visibility === "PRIVATE" ? "warning" : "neutral"}>
                      {t(`drive.visibility.${f.visibility}` as DictKey)}
                    </Badge>
                  </Td>
                  <Td>{f.ownerName ?? f.ownerEmail}</Td>
                  <Td>
                    {new Date(f.createdAt).toLocaleDateString(lang === "ar" ? "ar" : "en", {
                      dateStyle: "medium",
                    })}
                  </Td>
                  <Td>
                    <div className="row-actions">
                      <a href={`/api/drive/${f.id}`} download>
                        <Button variant="ghost" title={t("drive.download")}>
                          <Download size={15} aria-hidden />
                        </Button>
                      </a>
                      {(isRoot || f.ownerEmail === meEmail) && (
                        <Button
                          variant="ghost"
                          title={t("common.delete")}
                          onClick={() => {
                            if (confirm(t("common.confirmDelete"))) deleteDriveFile(f.id);
                          }}
                        >
                          <Trash2 size={15} aria-hidden className="icon-danger" />
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title={t("drive.upload")}>
        <form ref={formRef} onSubmit={submitUpload} className="form-stack">
          <div>
            <Label htmlFor="dv-file">{t("drive.file")}</Label>
            <Input id="dv-file" name="file" type="file" required />
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="dv-folder">{t("drive.folder")}</Label>
              <Input id="dv-folder" name="folderPath" placeholder="/documents" />
            </div>
            <div>
              <Label htmlFor="dv-visibility">{t("drive.visibility")}</Label>
              <Select id="dv-visibility" name="visibility" defaultValue="ORGANIZATION">
                <option value="ORGANIZATION">{t("drive.visibility.ORGANIZATION")}</option>
                <option value="PRIVATE">{t("drive.visibility.PRIVATE")}</option>
              </Select>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => setUploadOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {t("drive.upload")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
