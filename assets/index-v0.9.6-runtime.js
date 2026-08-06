const PRELOAD_REL = "modulepreload";
const preloaded = Object.create(null);

export class FlatConfig {
  constructor(name, values) {
    this.name = name;
    this.values = values;
    this.unreadKeys = new Set(values.keys());
  }

  static parse(source, name) {
    const values = new Map();
    for (const [index, rawLine] of source.split(/\r?\n/).entries()) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }
      const separator = line.indexOf(":");
      if (separator <= 0) {
        throw new Error(`Invalid ${name} config at line ${index + 1}.`);
      }
      const key = line.slice(0, separator).trim();
      const rawValue = line.slice(separator + 1).trim();
      if (!rawValue) {
        throw new Error(`Missing value for ${key} at line ${index + 1}.`);
      }
      if (values.has(key)) {
        throw new Error(
          `Duplicate ${name} config value ${key} at line ${index + 1}.`,
        );
      }
      const value = FlatConfig.stripQuotes(rawValue, name, index + 1);
      if (!value) {
        throw new Error(`Missing value for ${key} at line ${index + 1}.`);
      }
      values.set(key, value);
    }
    return new FlatConfig(name, values);
  }

  read(key) {
    const value = this.values.get(key);
    if (value === undefined) {
      throw new Error(`Missing ${this.name} config value: ${key}.`);
    }
    this.unreadKeys.delete(key);
    return value;
  }

  assertFullyConsumed() {
    if (this.unreadKeys.size === 0) {
      return;
    }
    const keys = [...this.unreadKeys].sort();
    throw new Error(
      `Unknown ${this.name} config value${keys.length === 1 ? "" : "s"}: ${keys.join(", ")}.`,
    );
  }

  static stripQuotes(value, name, line) {
    const first = value[0];
    const last = value[value.length - 1];
    const firstQuoted = first === '"' || first === "'";
    const lastQuoted = last === '"' || last === "'";
    if (firstQuoted !== lastQuoted || (firstQuoted && first !== last)) {
      throw new Error(`Invalid quoted ${name} config value at line ${line}.`);
    }
    return firstQuoted ? value.slice(1, -1) : value;
  }
}

export function preload(loader, dependencies = [], baseUrl = import.meta.url) {
  const promises = dependencies.map((dependency) => {
    const href = new URL(dependency, baseUrl).href;
    if (preloaded[href]) {
      return undefined;
    }
    preloaded[href] = true;

    const isCss = href.endsWith(".css");
    const selector = isCss ? '[rel="stylesheet"]' : "";
    if (document.querySelector(`link[href="${href}"]${selector}`)) {
      return undefined;
    }

    const link = document.createElement("link");
    link.rel = isCss ? "stylesheet" : PRELOAD_REL;
    if (!isCss) {
      link.as = "script";
    }
    link.crossOrigin = "";
    link.href = href;
    document.head.appendChild(link);

    if (!isCss) {
      return undefined;
    }
    return new Promise((resolve, reject) => {
      link.addEventListener("load", resolve, { once: true });
      link.addEventListener(
        "error",
        () => reject(new Error(`Unable to preload CSS for ${href}`)),
        { once: true },
      );
    });
  });

  return Promise.all(promises).then(() => loader()).catch((error) => {
    const event = new Event("vite:preloadError", { cancelable: true });
    event.payload = error;
    window.dispatchEvent(event);
    if (!event.defaultPrevented) {
      throw error;
    }
    return undefined;
  });
}

export class RuntimeConfigLoader {
  async load(url = "./config/runtime.yaml") {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Unable to load runtime config from ${url}: HTTP ${response.status}`,
      );
    }
    return this.parse(await response.text());
  }

  parse(source) {
    const config = FlatConfig.parse(source, "runtime");
    const result = Object.freeze({
      compactMaxWidth: this.readPositiveNumber(config, "compactMaxWidth"),
      desktop: Object.freeze(this.readTier(config, "desktop")),
      compact: Object.freeze(this.readTier(config, "compact")),
    });
    config.assertFullyConsumed();
    return result;
  }

  readTier(config, prefix) {
    return {
      cameraFov: this.readRange(config, `${prefix}CameraFov`, 30, 90),
      cameraMargin: this.readRange(config, `${prefix}CameraMargin`, 1, 3),
      cameraElevation: this.readRange(
        config,
        `${prefix}CameraElevation`,
        0.1,
        3,
      ),
      maxPixelRatio: this.readRange(
        config,
        `${prefix}MaxPixelRatio`,
        0.5,
        3,
      ),
      autoRotate: this.readBoolean(config, `${prefix}AutoRotate`),
      shadows: this.readBoolean(config, `${prefix}Shadows`),
      shadowMapSize: this.readPowerOfTwo(config, `${prefix}ShadowMapSize`),
      showGui: this.readBoolean(config, `${prefix}ShowGui`),
      showDecorativeText: this.readBoolean(
        config,
        `${prefix}ShowDecorativeText`,
      ),
    };
  }

  readBoolean(config, key) {
    const value = config.read(key).toLowerCase();
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    throw new Error(`Runtime config value ${key} must be true or false.`);
  }

  readPowerOfTwo(config, key) {
    const value = this.readPositiveInteger(config, key);
    if ((value & (value - 1)) !== 0) {
      throw new Error(`Runtime config value ${key} must be a power of two.`);
    }
    return value;
  }

  readPositiveInteger(config, key) {
    const value = this.readPositiveNumber(config, key);
    if (!Number.isInteger(value)) {
      throw new Error(`Runtime config value ${key} must be an integer.`);
    }
    return value;
  }

  readPositiveNumber(config, key) {
    const value = this.readNumber(config, key);
    if (value <= 0) {
      throw new Error(`Runtime config value ${key} must be positive.`);
    }
    return value;
  }

  readRange(config, key, minimum, maximum) {
    const value = this.readNumber(config, key);
    if (value < minimum || value > maximum) {
      throw new Error(
        `Runtime config value ${key} must be between ${minimum} and ${maximum}.`,
      );
    }
    return value;
  }

  readNumber(config, key) {
    const value = Number(config.read(key));
    if (!Number.isFinite(value)) {
      throw new Error(`Runtime config value ${key} must be a number.`);
    }
    return value;
  }
}

export function resolveRuntimeProfile(config) {
  const compact =
    window.innerWidth <= config.compactMaxWidth ||
    window.matchMedia("(pointer: coarse)").matches ||
    (navigator.maxTouchPoints > 0 &&
      /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent));
  const tier = compact ? config.compact : config.desktop;
  return Object.freeze({ ...tier, compact });
}
