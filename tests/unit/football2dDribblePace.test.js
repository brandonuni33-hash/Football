import test from "node:test";
import assert from "node:assert/strict";
import { getBallControlFeel, getDribblePace } from "../../prototype/football-2d-v0/football2dModel.js";

test("dribble pace changes touch distance at control 100", () => {
  const control = getBallControlFeel({ ballControl: 1 });
  const slow = getDribblePace(0.3, control);
  const normal = getDribblePace(0.65, control);
  const fast = getDribblePace(1, control);
  assert.equal(slow.label, "lent");
  assert.equal(normal.label, "normal");
  assert.equal(fast.label, "rapide");
  assert.ok(slow.touchDistance < normal.touchDistance);
  assert.ok(normal.touchDistance < fast.touchDistance);
  assert.ok(fast.touchDistance - slow.touchDistance > 15);
});
