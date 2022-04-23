export enum HttpEndpoint {
  PLURAL = "objects",
  SINGULAR = "object",
  WITH_GAP = "objects/{0}",
  WITH_TWO_GAPS = "objects/{0}/action/{1}",
  NON_EXISTING = "non_existing",
}
