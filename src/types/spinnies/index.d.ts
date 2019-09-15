// This will be removed after fixing https://github.com/jcarpanelli/spinnies/issues/4
declare module "spinnies" {
  class Spinnies {
    constructor(options?: object);

    add(name: string, options?: object): Spinnies;
    update<T extends object>(name: string, options?: T): T;
    succeed<T extends object>(name: string, options?: T): T;
    fail<T extends object>(name: string, options?: T): T;

    stopAll(status?: "succeed" | "fail" | "stopped"): Spinnies;
  }

  export = Spinnies;
}
