import { autoSpy } from "autoSpy";
import { ToUpdate } from "./to-update";

describe("ToUpdate", () => {});

function setup() {
  let str: string;
  const spec = autoSpy(Object);
  const builder = {
    str,
    spec,
    default() {
      return builder;
    },
    build() {
      return new ToUpdate(str, spec);
    }
  };

  return builder;
}
