import { UVAdaptor } from "./UVAdaptor";
import { Urls } from "@edsilv/utils";
import { UniversalViewer } from "./UniversalViewer";
import { IUVData } from "./IUVData";

export class URLAdaptor extends UVAdaptor {

  constructor(
    readonly: boolean = false
  ) {
    super(readonly);
  }

  public get(
    key: string,
    defaultValue?: string | number | null
  ): string | null {
    return (
      Urls.getHashParameter(key, document) ||
      (defaultValue || "").toString() ||
      null
    );
  }

  public getFragment(key: string, url: string): string | null {
    const regex = new RegExp("#.*" + key + "=([^&]+)(&|$)");
    const match = regex.exec(url);
    return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : null;
  }

  public set(key: string, value: string | number | null): void {
    if (!this.readonly) {
      if (value) {
        Urls.setHashParameter(key, value.toString(), document);
      } else {
        Urls.setHashParameter(key, "", document);
      }
    }
  }

  public getInitialData(defaults?: IUVData) {
    const formattedLocales: Array<{ label?: string; name: string }> = [];
    const locales = this.get("locales", "");
    if (locales) {
      const names = locales.split(",");
      for (let i in names) {
        const parts = String(names[i]).split(":");
        formattedLocales[i] = { name: parts[0], label: parts[1] };
      }
    } else {
      formattedLocales.push({
        name: "en-GB",
      });
    }

    return {
      manifest: this.get("manifest"),
      collectionIndex:
        this.get("c") !== undefined
          ? Number(this.get("c"))
          : undefined,
      manifestIndex: Number(this.get("m", 0)),
      canvasIndex: Number(this.get("cv", 0)),
      rotation: Number(this.get("r", 0)),
      rangeId: this.get("rid", ""),
      xywh: this.get("xywh", ""),
      target: this.get("target", ""),
      cfi: this.get("cfi", ""),
      locales: formattedLocales.length ? formattedLocales : undefined,
      ...defaults
    }
  }

  public bindTo(uv: UniversalViewer) {
    uv.on(
      "pause",
      (currentTime) => {
        if (currentTime > 0) {
          this.set("t", currentTime);
        }
      },
      false
    );

    uv.on(
      "collectionIndexChange",
      (collectionIndex) => {
        this.set("c", collectionIndex);
      },
      false
    );

    uv.on(
      "manifestIndexChange",
      (manifestIndex) => {
        this.set("m", manifestIndex);
      },
      false
    );

    uv.on(
      "canvasIndexChange",
      (canvasIndex) => {
        this.set("cv", canvasIndex);
      },
      false
    );

    uv.on(
      "rangeChange",
      (rangeId) => {
        this.set("rid", rangeId);
      },
      false
    );

    uv.on(
      "targetChange",
      (target) => {
        this.set("xywh", this.getFragment("xywh", target));
      },
      false
    );
  }
}
