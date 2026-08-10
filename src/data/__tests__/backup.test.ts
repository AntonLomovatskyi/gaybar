import { describe, expect, it } from "vitest";
import { getCloudSnapshot, getSnapshot } from "@/data/backup";
import { useUserStore } from "@/store/userStore";

describe("backup snapshots keep the API key out of the export file", () => {
  it("cloud snapshot carries the key, file snapshot does not", () => {
    useUserStore.getState().setAnthropicApiKey("sk-ant-secret");
    useUserStore.getState().setAiModel("claude-haiku-4-5");

    const file = getSnapshot();
    const cloud = getCloudSnapshot();

    // The downloadable backup must never contain the key…
    expect(file.anthropicApiKey).toBeUndefined();
    expect(JSON.stringify(file)).not.toContain("sk-ant-secret");

    // …but the Firestore snapshot carries it, so another device restores it on sign-in.
    expect(cloud.anthropicApiKey).toBe("sk-ant-secret");
    expect(cloud.aiModel).toBe("claude-haiku-4-5");
  });

  it("importing a snapshot without a key never clears the local one", () => {
    useUserStore.getState().setAnthropicApiKey("sk-ant-local");
    useUserStore.getState().importData(getSnapshot()); // file backup: no key inside
    expect(useUserStore.getState().anthropicApiKey).toBe("sk-ant-local");
  });
});
