import inherits from 'inherits-browser';
import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import { createLine } from 'diagram-js/lib/util/RenderUtil';

const HIGH_PRIORITY = 1500;

// Default color for constraint flows
const DEFAULT_CONSTRAINT_COLOR = '#0066CC'; // Blue

// Store rendered constraint elements for dynamic updates
const renderedConstraints = new Map(); // Maps constraint flow ID -> { element, constraintType, currentColor }

export default function ConstraintRenderer(eventBus, bpmnRenderer) {
  BaseRenderer.call(this, eventBus, HIGH_PRIORITY);

  this.canRender = function(element) {
    return element && element.businessObject && element.businessObject.$type === 'constraint:ConstraintFlow';
  };

  this.drawConnection = function(parentGfx, element) {
    const waypoints = element.waypoints;
    const constraintType = element.businessObject.constraintType;
    const color = DEFAULT_CONSTRAINT_COLOR;

    // Create container for all constraint flow elements
    const constraintGroup = this.createConstraintGroup(parentGfx, constraintType);

    // Draw the constraint based on its type
    this.drawConstraintByType(constraintGroup, waypoints, constraintType, color);

    // Store reference to the rendered elements for dynamic updates
    if (constraintType && element.id) {
      this.storeConstraintReference(element, constraintGroup, constraintType, color);
    }

    // Emit event for constraint panel to update
    eventBus.fire('constraint.rendered', {
      constraintId: element.id,
      constraintType: constraintType,
      element: element
    });

    return constraintGroup.querySelector('line') || constraintGroup.querySelector('path');
  };

  // Create the main constraint group container
  this.createConstraintGroup = function(parentGfx, constraintType) {
    const constraintGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    constraintGroup.setAttribute('class', 'constraint-flow-group');
    constraintGroup.setAttribute('data-constraint-type', constraintType);
    parentGfx.appendChild(constraintGroup);
    return constraintGroup;
  };

  // Factory method to draw constraint based on type
  this.drawConstraintByType = function(constraintGroup, waypoints, constraintType, color) {
    switch (constraintType?.toLowerCase()) {
    case 'existence':
      this.drawExistenceConstraint(constraintGroup, waypoints, color, constraintType); // todo
      break;
    case 'absence2':
      this.drawAbsence2Constraint(constraintGroup, waypoints, color, constraintType); // todo
      break;
    case 'choice':
      this.drawChoiceConstraint(constraintGroup, waypoints, color, constraintType); // todo
      break;
    case 'resp-existence':
      this.drawRespExistenceConstraint(constraintGroup, waypoints, color, constraintType); // done
      break;
    case 'coexistence':
      this.drawCoExistenceConstraint(constraintGroup, waypoints, color, constraintType); // dene
      break;
    case 'response':
      this.drawResponseConstraint(constraintGroup, waypoints, color, constraintType); // done
      break;
    case 'precedence':
      this.drawPrecedenceConstraint(constraintGroup, waypoints, color, constraintType); // done
      break;
    case 'succession':
      this.drawSuccessionConstraint(constraintGroup, waypoints, color, constraintType); // doene
      break;
    case 'alt-response':
      this.drawAltResponseConstraint(constraintGroup, waypoints, color, constraintType); // done
      break;
    case 'alt-precedence':
      this.drawAltPrecedenceConstraint(constraintGroup, waypoints, color, constraintType); // done
      break;
    case 'chain-response':
      this.drawChainResponseConstraint(constraintGroup, waypoints, color, constraintType); // done
      break;
    case 'chain-precedence':
      this.drawChainPrecedenceConstraint(constraintGroup, waypoints, color, constraintType); // done
      break;
    case 'chain-succession':
      this.drawChainSuccessionConstraint(constraintGroup, waypoints, color, constraintType); // done
      break;
    case 'not-coexistence':
      this.drawNotCoExistenceConstraint(constraintGroup, waypoints, color, constraintType); // done
      break;
    case 'neg-succession':
      this.drawNegSuccessionConstraint(constraintGroup, waypoints, color, constraintType); // done
      break;
    case 'neg-chain-succession':
      this.drawNegChainSuccessionConstraint(constraintGroup, waypoints, color, constraintType); // done
      break;
    default:
      this.drawDefaultConstraint(constraintGroup, waypoints, color, constraintType);
      break;
    }
  };

  // Draw existence constraint (small box inside activity)
  this.drawExistenceConstraint = function(constraintGroup, waypoints, color, constraintType) {

    // Position the box inside the top-right corner of the activity
    const activityCenter = waypoints[0];

    const boxWidth = 50;
    const boxHeight = 14;

    // Position inside the activity - top-right corner
    const boxX = activityCenter.x - 70; // Offset to right side inside activity
    const boxY = activityCenter.y - 45; // Offset to top inside activity

    // Create the constraint box
    const constraintBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    constraintBox.setAttribute('x', boxX);
    constraintBox.setAttribute('y', boxY);
    constraintBox.setAttribute('width', boxWidth);
    constraintBox.setAttribute('height', boxHeight);
    constraintBox.setAttribute('fill', 'white');
    constraintBox.setAttribute('stroke', color);
    constraintBox.setAttribute('stroke-width', '1.5');
    constraintBox.setAttribute('rx', '3');
    constraintBox.setAttribute('ry', '3');
    constraintGroup.appendChild(constraintBox);

    // Add the constraint label inside the box
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', boxX + boxWidth / 2);
    label.setAttribute('y', boxY + boxHeight / 2 + 4);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-family', 'Arial, sans-serif');
    label.setAttribute('font-size', '9');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('fill', color);
    label.textContent = 'existence';
    constraintGroup.appendChild(label);

    return { constraintBox, label };
  };

  // Draw absence2 constraint (small box inside activity)
  this.drawAbsence2Constraint = function(constraintGroup, waypoints, color, constraintType) {

    // Position the box inside the top-left corner of the activity
    const activityCenter = waypoints[0];

    const boxWidth = 50;
    const boxHeight = 14;

    // Position inside the activity - top-left corner
    const boxX = activityCenter.x - 70; // Offset to left side inside activity
    const boxY = activityCenter.y - 45; // Offset to top inside activity

    // Create the constraint box
    const constraintBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    constraintBox.setAttribute('x', boxX);
    constraintBox.setAttribute('y', boxY);
    constraintBox.setAttribute('width', boxWidth);
    constraintBox.setAttribute('height', boxHeight);
    constraintBox.setAttribute('fill', 'white');
    constraintBox.setAttribute('stroke', color);
    constraintBox.setAttribute('stroke-width', '1.5');
    constraintBox.setAttribute('rx', '3');
    constraintBox.setAttribute('ry', '3');
    constraintGroup.appendChild(constraintBox);

    // Add the constraint label inside the box
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', boxX + boxWidth / 2);
    label.setAttribute('y', boxY + boxHeight / 2 + 4);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-family', 'Arial, sans-serif');
    label.setAttribute('font-size', '9');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('fill', color);
    label.textContent = 'absence';
    constraintGroup.appendChild(label);

    return { constraintBox, label };
  };

  // Draw choice constraint (branching lines)
  this.drawChoiceConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const midPoint = this.getMidPoint(waypoints);
    const line = this.createBasicLine(waypoints, color, 2);
    constraintGroup.appendChild(line);

    // const branchMarker = this.createBranchMarker(midPoint, color);
    // constraintGroup.appendChild(branchMarker);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, label };
  };

  // Draw resp-existence constraint (dashed line with circle)
  this.drawRespExistenceConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createBasicLine(waypoints, color, 3);
    constraintGroup.appendChild(line);

    const circle = this.createSourceDot(waypoints[0], color, 6);
    circle.setAttribute('stroke', 'white');
    circle.setAttribute('stroke-width', '1');
    constraintGroup.appendChild(circle);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, circle };
  };

  // Draw alternating response constraint (dashed line with double arrow)
  this.drawAltResponseConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createDoubleLine(waypoints, 4, color, 2, 10);
    constraintGroup.appendChild(line);

    const dot = this.createSourceDot(waypoints[0], color, 7);
    constraintGroup.appendChild(dot);

    const arrow = this.createArrowHead(waypoints, color);
    constraintGroup.appendChild(arrow);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, dot, arrow, label };
  };

  // Draw alternating precedence constraint (dashed line with reverse arrow)
  this.drawAltPrecedenceConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createDoubleLine(waypoints, 4, color, 2, 15);
    constraintGroup.appendChild(line);

    const arrow = this.createArrowDotHead(waypoints, color);
    constraintGroup.appendChild(arrow);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, arrow, label };
  };

  // Draw chain response constraint (thick solid line with chain marker)
  this.drawChainResponseConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createTripleLine(waypoints, 4, color, 2, 13);
    constraintGroup.appendChild(line);

    const dot = this.createSourceDot(waypoints[0], color, 7);
    constraintGroup.appendChild(dot);

    const arrow = this.createArrowHead(waypoints, color);
    constraintGroup.appendChild(arrow);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, dot, arrow };
  };

  // Draw chain precedence constraint (thick solid line with reverse arrow and chain)
  this.drawChainPrecedenceConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createTripleLine(waypoints, 4, color, 2, 20);
    constraintGroup.appendChild(line);

    const arrow = this.createArrowDotHead(waypoints, color);
    constraintGroup.appendChild(arrow);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, arrow, label };
  };

  // Draw chain succession constraint (thick line with double arrow and chain)
  this.drawChainSuccessionConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createTripleLine(waypoints, 4, color, 2, 20);
    constraintGroup.appendChild(line);

    const dot = this.createSourceDot(waypoints[0], color, 7);
    constraintGroup.appendChild(dot);

    const arrow = this.createArrowDotHead(waypoints, color);
    constraintGroup.appendChild(arrow);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, dot, arrow, label };
  };

  // Draw not-coexistence constraint (line with double X)
  this.drawNotCoExistenceConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createBasicLine(waypoints, color, 3);
    constraintGroup.appendChild(line);

    const dot1 = this.createSourceDot(waypoints[0], color, 7);
    constraintGroup.appendChild(dot1);

    const dot2 = this.createSourceDot(waypoints[waypoints.length - 1], color, 7);
    constraintGroup.appendChild(dot2);

    const negMarker = this.createNegLine(waypoints, color);
    constraintGroup.appendChild(negMarker);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, dot1, dot2, negMarker, label };
  };

  // Draw negative succession constraint (crossed succession)
  this.drawNegSuccessionConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createBasicLine(waypoints, color, 3);
    constraintGroup.appendChild(line);

    const dot = this.createSourceDot(waypoints[0], color, 7);
    constraintGroup.appendChild(dot);

    const arrow = this.createArrowDotHead(waypoints, color);
    constraintGroup.appendChild(arrow);

    const negMarker = this.createNegLine(waypoints, color);
    constraintGroup.appendChild(negMarker);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, dot, arrow, negMarker, label };
  };

  // Draw negative chain succession constraint (crossed thick succession)
  this.drawNegChainSuccessionConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createTripleLine(waypoints, 4, color, 2, 20);
    constraintGroup.appendChild(line);

    const dot = this.createSourceDot(waypoints[0], color, 7);
    constraintGroup.appendChild(dot);

    const arrow = this.createArrowDotHead(waypoints, color);
    constraintGroup.appendChild(arrow);

    const negMarker = this.createNegLine(waypoints, color);
    constraintGroup.appendChild(negMarker);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, dot, arrow, negMarker, label };
  };

  // Helper: Create cross marker for absence constraints
  this.createCrossMarker = function(point, color, size) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', point.x - size / 2);
    line1.setAttribute('y1', point.y - size / 2);
    line1.setAttribute('x2', point.x + size / 2);
    line1.setAttribute('y2', point.y + size / 2);
    line1.setAttribute('stroke', color);
    line1.setAttribute('stroke-width', '2');
    group.appendChild(line1);

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', point.x - size / 2);
    line2.setAttribute('y1', point.y + size / 2);
    line2.setAttribute('x2', point.x + size / 2);
    line2.setAttribute('y2', point.y - size / 2);
    line2.setAttribute('stroke', color);
    line2.setAttribute('stroke-width', '2');
    group.appendChild(line2);

    return group;
  };

  // Helper: Create branch marker for choice constraints
  this.createBranchMarker = function(point, color) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const length = 12;

    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', point.x);
    line1.setAttribute('y1', point.y);
    line1.setAttribute('x2', point.x + length);
    line1.setAttribute('y2', point.y - length);
    line1.setAttribute('stroke', color);
    line1.setAttribute('stroke-width', '2');
    group.appendChild(line1);

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', point.x);
    line2.setAttribute('y1', point.y);
    line2.setAttribute('x2', point.x + length);
    line2.setAttribute('y2', point.y + length);
    line2.setAttribute('stroke', color);
    line2.setAttribute('stroke-width', '2');
    group.appendChild(line2);

    return group;
  };

  // Helper: Create alternating marker (zigzag)
  this.createAlternatingMarker = function(waypoints, color) {
    const midPoint = this.getMidPoint(waypoints);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const zigzag = `M ${midPoint.x - 10} ${midPoint.y + 15} L ${midPoint.x - 5} ${midPoint.y + 10} L ${midPoint.x} ${midPoint.y + 15} L ${midPoint.x + 5} ${midPoint.y + 10} L ${midPoint.x + 10} ${midPoint.y + 15}`;
    path.setAttribute('d', zigzag);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    return path;
  };

  // Helper: Create chain marker (chain links)
  this.createChainMarker = function(waypoints, color) {
    const midPoint = this.getMidPoint(waypoints);
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    for (let i = 0; i < 3; i++) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', midPoint.x - 15 + i * 10);
      rect.setAttribute('y', midPoint.y + 10);
      rect.setAttribute('width', '6');
      rect.setAttribute('height', '4');
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', '1');
      group.appendChild(rect);
    }

    return group;
  };

  // Helper: Create negation marker (diagonal slash)
  this.createNegationMarker = function(waypoints, color) {
    const midPoint = this.getMidPoint(waypoints);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', midPoint.x - 15);
    line.setAttribute('y1', midPoint.y - 15);
    line.setAttribute('x2', midPoint.x + 15);
    line.setAttribute('y2', midPoint.y + 15);
    line.setAttribute('stroke', 'red');
    line.setAttribute('stroke-width', '3');
    return line;
  };

  // Helper: Create reverse arrow head (pointing backwards)
  this.createReverseArrowHead = function(waypoints, color) {
    const src = waypoints[0];
    const next = waypoints[1] || src;
    const angle = Math.atan2(next.y - src.y, next.x - src.x);
    const arrowLength = 20;
    const arrowPath = [
      { x: src.x, y: src.y },
      { x: src.x + arrowLength * Math.cos(angle - Math.PI / 8), y: src.y + arrowLength * Math.sin(angle - Math.PI / 8) },
      { x: src.x + arrowLength * Math.cos(angle + Math.PI / 8), y: src.y + arrowLength * Math.sin(angle + Math.PI / 8) },
      { x: src.x, y: src.y }
    ];
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow.setAttribute('points', arrowPath.map(p => `${p.x},${p.y}`).join(' '));
    arrow.setAttribute('fill', color);
    return arrow;
  };

  // Draw precedence constraint (solid line with arrow)
  this.drawPrecedenceConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createBasicLine(waypoints, color, 3);
    constraintGroup.appendChild(line);

    const arrowDot = this.createArrowDotHead(waypoints, color);
    constraintGroup.appendChild(arrowDot);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, arrowDot, label };
  };

  // Draw response constraint (dashed line with arrow)
  this.drawResponseConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createBasicLine(waypoints, color, 3);
    constraintGroup.appendChild(line);

    const dot = this.createSourceDot(waypoints[0], color, 7);
    constraintGroup.appendChild(dot);

    const arrow = this.createArrowHead(waypoints, color);
    constraintGroup.appendChild(arrow);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, dot, arrow, label };
  };

  // Draw succession constraint (solid line with double arrow)
  this.drawSuccessionConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createBasicLine(waypoints, color, 3);
    constraintGroup.appendChild(line);

    const dot = this.createSourceDot(waypoints[0], color, 7);
    constraintGroup.appendChild(dot);

    const arrow = this.createArrowDotHead(waypoints, color);
    constraintGroup.appendChild(arrow);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, dot, arrow, label };
  };

  // Draw co-existence constraint (line with dots at both ends)
  this.drawCoExistenceConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createBasicLine(waypoints, color, 3);
    constraintGroup.appendChild(line);

    const dot = this.createSourceDot(waypoints[0], color, 7);
    constraintGroup.appendChild(dot);

    const dot2 = this.createSourceDot(waypoints[waypoints.length - 1], color, 7);
    constraintGroup.appendChild(dot2);

    const label = this.createConstraintLabel(waypoints, constraintType, color);
    constraintGroup.appendChild(label);

    return { line, dot, dot2, label };
  };

  // Draw default constraint (fallback)
  this.drawDefaultConstraint = function(constraintGroup, waypoints, color, constraintType) {
    const line = this.createBasicLine(waypoints, color, 3);
    constraintGroup.appendChild(line);

    const dot = this.createSourceDot(waypoints[0], color, 7);
    constraintGroup.appendChild(dot);

    const arrow = this.createArrowHead(waypoints, color);
    constraintGroup.appendChild(arrow);

    const label = this.createConstraintLabel(waypoints, constraintType || 'CONSTRAINT', color);
    constraintGroup.appendChild(label);

    return { line, dot, arrow, label };
  };

  // Helper: Create basic line
  this.createBasicLine = function(waypoints, color, strokeWidth, dashArray) {
    const line = createLine(waypoints, {
      stroke: color,
      strokeWidth: strokeWidth,
      strokeDasharray: dashArray || 'none'
    });
    return line;
  };

  this.createDoubleLine = function(waypoints, gap, color, strokeWidth, margin, dashArray) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Apply margin by adjusting the last waypoint
    let adjustedWaypoints = waypoints;
    if (margin && margin > 0 && waypoints.length >= 2) {
      adjustedWaypoints = [ ...waypoints ];
      const lastIndex = adjustedWaypoints.length - 1;
      const secondLastIndex = lastIndex - 1;

      const lastPoint = adjustedWaypoints[lastIndex];
      const secondLastPoint = adjustedWaypoints[secondLastIndex];

      // Calculate direction vector from second last to last point
      const dx = lastPoint.x - secondLastPoint.x;
      const dy = lastPoint.y - secondLastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > margin) {

        // Normalize direction vector and apply margin
        const unitX = dx / distance;
        const unitY = dy / distance;

        adjustedWaypoints[lastIndex] = {
          x: lastPoint.x - margin * unitX,
          y: lastPoint.y - margin * unitY
        };
      }
    }

    // Calculate perpendicular offset for parallel lines
    const offsetWaypoints1 = [];
    const offsetWaypoints2 = [];

    for (let i = 0; i < adjustedWaypoints.length; i++) {
      const current = adjustedWaypoints[i];
      let perpAngle;

      if (i === 0) {

        // First point: use angle to next point
        const next = adjustedWaypoints[i + 1] || current;
        perpAngle = Math.atan2(next.y - current.y, next.x - current.x) + Math.PI / 2;
      } else if (i === adjustedWaypoints.length - 1) {

        // Last point: use angle from previous point
        const prev = adjustedWaypoints[i - 1];
        perpAngle = Math.atan2(current.y - prev.y, current.x - prev.x) + Math.PI / 2;
      } else {

        // Middle points: average the angles from previous and to next
        const prev = adjustedWaypoints[i - 1];
        const next = adjustedWaypoints[i + 1];
        const angle1 = Math.atan2(current.y - prev.y, current.x - prev.x);
        const angle2 = Math.atan2(next.y - current.y, next.x - current.x);
        perpAngle = (angle1 + angle2) / 2 + Math.PI / 2;
      }

      // Calculate offset points
      const halfGap = gap / 2;
      const offsetX = halfGap * Math.cos(perpAngle);
      const offsetY = halfGap * Math.sin(perpAngle);

      offsetWaypoints1.push({
        x: current.x + offsetX,
        y: current.y + offsetY
      });

      offsetWaypoints2.push({
        x: current.x - offsetX,
        y: current.y - offsetY
      });
    }

    // Create first parallel line
    const line1 = createLine(offsetWaypoints1, {
      stroke: color,
      strokeWidth: strokeWidth || 2,
      strokeDasharray: dashArray || 'none'
    });
    group.appendChild(line1);

    // Create second parallel line
    const line2 = createLine(offsetWaypoints2, {
      stroke: color,
      strokeWidth: strokeWidth || 2,
      strokeDasharray: dashArray || 'none'
    });
    group.appendChild(line2);

    return group;
  };

  this.createTripleLine = function(waypoints, gap, color, strokeWidth, margin, dashArray) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Apply margin by adjusting the last waypoint
    let adjustedWaypoints = waypoints;
    if (margin && margin > 0 && waypoints.length >= 2) {
      adjustedWaypoints = [ ...waypoints ];
      const lastIndex = adjustedWaypoints.length - 1;
      const secondLastIndex = lastIndex - 1;

      const lastPoint = adjustedWaypoints[lastIndex];
      const secondLastPoint = adjustedWaypoints[secondLastIndex];

      // Calculate direction vector from second last to last point
      const dx = lastPoint.x - secondLastPoint.x;
      const dy = lastPoint.y - secondLastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > margin) {

        // Normalize direction vector and apply margin
        const unitX = dx / distance;
        const unitY = dy / distance;

        adjustedWaypoints[lastIndex] = {
          x: lastPoint.x - margin * unitX,
          y: lastPoint.y - margin * unitY
        };
      }
    }

    // Calculate perpendicular offset for parallel lines
    const offsetWaypoints1 = []; // Top line
    const offsetWaypoints2 = []; // Middle line (original path)
    const offsetWaypoints3 = []; // Bottom line

    for (let i = 0; i < adjustedWaypoints.length; i++) {
      const current = adjustedWaypoints[i];
      let perpAngle;

      if (i === 0) {

        // First point: use angle to next point
        const next = adjustedWaypoints[i + 1] || current;
        perpAngle = Math.atan2(next.y - current.y, next.x - current.x) + Math.PI / 2;
      } else if (i === adjustedWaypoints.length - 1) {

        // Last point: use angle from previous point
        const prev = adjustedWaypoints[i - 1];
        perpAngle = Math.atan2(current.y - prev.y, current.x - prev.x) + Math.PI / 2;
      } else {

        // Middle points: average the angles from previous and to next
        const prev = adjustedWaypoints[i - 1];
        const next = adjustedWaypoints[i + 1];
        const angle1 = Math.atan2(current.y - prev.y, current.x - prev.x);
        const angle2 = Math.atan2(next.y - current.y, next.x - current.x);
        perpAngle = (angle1 + angle2) / 2 + Math.PI / 2;
      }

      // Calculate offset points
      const offsetX = gap * Math.cos(perpAngle);
      const offsetY = gap * Math.sin(perpAngle);

      // Top line (offset by +gap)
      offsetWaypoints1.push({
        x: current.x + offsetX,
        y: current.y + offsetY
      });

      // Middle line (original path)
      offsetWaypoints2.push({
        x: current.x,
        y: current.y
      });

      // Bottom line (offset by -gap)
      offsetWaypoints3.push({
        x: current.x - offsetX,
        y: current.y - offsetY
      });
    }

    // Create first parallel line (top)
    const line1 = createLine(offsetWaypoints1, {
      stroke: color,
      strokeWidth: strokeWidth || 2,
      strokeDasharray: dashArray || 'none'
    });
    group.appendChild(line1);

    // Create middle line (original path)
    const line2 = createLine(offsetWaypoints2, {
      stroke: color,
      strokeWidth: strokeWidth || 2,
      strokeDasharray: dashArray || 'none'
    });
    group.appendChild(line2);

    // Create third parallel line (bottom)
    const line3 = createLine(offsetWaypoints3, {
      stroke: color,
      strokeWidth: strokeWidth || 2,
      strokeDasharray: dashArray || 'none'
    });
    group.appendChild(line3);

    return group;
  };

  // Helper: Create source dot
  this.createSourceDot = function(point, color, radius) {
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', point.x);
    dot.setAttribute('cy', point.y);
    dot.setAttribute('r', radius);
    dot.setAttribute('fill', color);
    return dot;
  };

  // Helper: Create arrow head
  this.createArrowHead = function(waypoints, color) {
    const tgt = waypoints[waypoints.length - 1];
    const prev = waypoints[waypoints.length - 2] || tgt;
    const angle = Math.atan2(tgt.y - prev.y, tgt.x - prev.x);
    const arrowLength = 20;
    const arrowPath = [
      { x: tgt.x, y: tgt.y },
      { x: tgt.x - arrowLength * Math.cos(angle - Math.PI / 8), y: tgt.y - arrowLength * Math.sin(angle - Math.PI / 8) },
      { x: tgt.x - arrowLength * Math.cos(angle + Math.PI / 8), y: tgt.y - arrowLength * Math.sin(angle + Math.PI / 8) },
      { x: tgt.x, y: tgt.y }
    ];
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow.setAttribute('points', arrowPath.map(p => `${p.x},${p.y}`).join(' '));
    arrow.setAttribute('fill', color);
    return arrow;
  };

  // Helper: Create double arrow head for succession
  this.createDoubleArrowHead = function(waypoints, color) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const tgt = waypoints[waypoints.length - 1];
    const prev = waypoints[waypoints.length - 2] || tgt;
    const angle = Math.atan2(tgt.y - prev.y, tgt.x - prev.x);
    const arrowLength = 12;

    // First arrow
    const arrow1Path = [
      { x: tgt.x, y: tgt.y },
      { x: tgt.x - arrowLength * Math.cos(angle - Math.PI / 8), y: tgt.y - arrowLength * Math.sin(angle - Math.PI / 8) },
      { x: tgt.x - arrowLength * Math.cos(angle + Math.PI / 8), y: tgt.y - arrowLength * Math.sin(angle + Math.PI / 8) }
    ];
    const arrow1 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow1.setAttribute('points', arrow1Path.map(p => `${p.x},${p.y}`).join(' '));
    arrow1.setAttribute('fill', color);
    group.appendChild(arrow1);

    // Second arrow (offset)
    const offset = 8;
    const arrow2Path = [
      { x: tgt.x - offset * Math.cos(angle), y: tgt.y - offset * Math.sin(angle) },
      { x: tgt.x - (arrowLength + offset) * Math.cos(angle - Math.PI / 8), y: tgt.y - (arrowLength + offset) * Math.sin(angle - Math.PI / 8) },
      { x: tgt.x - (arrowLength + offset) * Math.cos(angle + Math.PI / 8), y: tgt.y - (arrowLength + offset) * Math.sin(angle + Math.PI / 8) }
    ];
    const arrow2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow2.setAttribute('points', arrow2Path.map(p => `${p.x},${p.y}`).join(' '));
    arrow2.setAttribute('fill', color);
    group.appendChild(arrow2);

    return group;
  };

  // Helper: Create arrow head followed by a dot
  this.createArrowDotHead = function(waypoints, color) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const tgt = waypoints[waypoints.length - 1];
    const prev = waypoints[waypoints.length - 2] || tgt;
    const angle = Math.atan2(tgt.y - prev.y, tgt.x - prev.x);
    const arrowLength = 20;

    // Create arrow head positioned back from the target point to make room for the dot
    const arrowTipX = tgt.x - 6 * Math.cos(angle); // Move arrow back by dot radius + small gap
    const arrowTipY = tgt.y - 6 * Math.sin(angle);

    const arrowPath = [
      { x: arrowTipX, y: arrowTipY },
      { x: arrowTipX - arrowLength * Math.cos(angle - Math.PI / 8), y: arrowTipY - arrowLength * Math.sin(angle - Math.PI / 8) },
      { x: arrowTipX - arrowLength * Math.cos(angle + Math.PI / 8), y: arrowTipY - arrowLength * Math.sin(angle + Math.PI / 8) },
      { x: arrowTipX, y: arrowTipY }
    ];
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow.setAttribute('points', arrowPath.map(p => `${p.x},${p.y}`).join(' '));
    arrow.setAttribute('fill', color);
    group.appendChild(arrow);

    // Create dot at the very tip (original target point)
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', tgt.x);
    dot.setAttribute('cy', tgt.y);
    dot.setAttribute('r', 7);
    dot.setAttribute('fill', color);
    dot.setAttribute('stroke', 'white');
    dot.setAttribute('stroke-width', '1');
    group.appendChild(dot);

    return group;
  };

  // Helper: Create two short parallel lines perpendicular to the main line
  this.createNegLine = function(waypoints, color) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const midPoint = this.getMidPoint(waypoints);

    // Calculate the angle of the main line at the midpoint
    let angle;
    if (waypoints.length >= 2) {
      const midIndex = Math.floor(waypoints.length / 2);
      if (midIndex === 0) {

        // Use angle from first to second point
        angle = Math.atan2(waypoints[1].y - waypoints[0].y, waypoints[1].x - waypoints[0].x);
      } else if (midIndex === waypoints.length - 1) {

        // Use angle from previous to last point
        angle = Math.atan2(waypoints[midIndex].y - waypoints[midIndex - 1].y, waypoints[midIndex].x - waypoints[midIndex - 1].x);
      } else {

        // Average angle of segments before and after midpoint
        const prevAngle = Math.atan2(waypoints[midIndex].y - waypoints[midIndex - 1].y, waypoints[midIndex].x - waypoints[midIndex - 1].x);
        const nextAngle = Math.atan2(waypoints[midIndex + 1].y - waypoints[midIndex].y, waypoints[midIndex + 1].x - waypoints[midIndex].x);
        angle = (prevAngle + nextAngle) / 2;
      }
    } else {
      angle = 0; // Default horizontal if only one point
    }

    // Perpendicular angle (90 degrees rotated)
    const perpAngle = angle + Math.PI / 2;

    // Line parameters
    const lineLength = 20; // Total length of each negation line
    const gap = 5; // Gap between the two parallel lines
    const strokeWidth = 2;

    // Calculate positions for the two parallel lines
    const halfGap = gap / 2;
    const offsetX = halfGap * Math.cos(angle); // Offset along main line direction
    const offsetY = halfGap * Math.sin(angle);

    // First negation line (offset in one direction)
    const line1StartX = midPoint.x + offsetX - (lineLength / 2) * Math.cos(perpAngle);
    const line1StartY = midPoint.y + offsetY - (lineLength / 2) * Math.sin(perpAngle);
    const line1EndX = midPoint.x + offsetX + (lineLength / 2) * Math.cos(perpAngle);
    const line1EndY = midPoint.y + offsetY + (lineLength / 2) * Math.sin(perpAngle);

    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', line1StartX);
    line1.setAttribute('y1', line1StartY);
    line1.setAttribute('x2', line1EndX);
    line1.setAttribute('y2', line1EndY);
    line1.setAttribute('stroke', color);
    line1.setAttribute('stroke-width', strokeWidth);
    group.appendChild(line1);

    // Second negation line (offset in opposite direction)
    const line2StartX = midPoint.x - offsetX - (lineLength / 2) * Math.cos(perpAngle);
    const line2StartY = midPoint.y - offsetY - (lineLength / 2) * Math.sin(perpAngle);
    const line2EndX = midPoint.x - offsetX + (lineLength / 2) * Math.cos(perpAngle);
    const line2EndY = midPoint.y - offsetY + (lineLength / 2) * Math.sin(perpAngle);

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', line2StartX);
    line2.setAttribute('y1', line2StartY);
    line2.setAttribute('x2', line2EndX);
    line2.setAttribute('y2', line2EndY);
    line2.setAttribute('stroke', color);
    line2.setAttribute('stroke-width', strokeWidth);
    group.appendChild(line2);

    return group;
  };

  // Helper: Create X marker for mutual exclusion
  this.createXMarker = function(waypoints, color) {
    const midPoint = this.getMidPoint(waypoints);
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const size = 8;

    // Create X shape with two lines
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', midPoint.x - size);
    line1.setAttribute('y1', midPoint.y - size);
    line1.setAttribute('x2', midPoint.x + size);
    line1.setAttribute('y2', midPoint.y + size);
    line1.setAttribute('stroke', color);
    line1.setAttribute('stroke-width', '3');
    group.appendChild(line1);

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', midPoint.x - size);
    line2.setAttribute('y1', midPoint.y + size);
    line2.setAttribute('x2', midPoint.x + size);
    line2.setAttribute('y2', midPoint.y - size);
    line2.setAttribute('stroke', color);
    line2.setAttribute('stroke-width', '3');
    group.appendChild(line2);

    return group;
  };

  // Helper: Create diamond marker for co-existence
  this.createDiamondMarker = function(point, color) {
    const size = 6;
    const diamondPath = [
      { x: point.x, y: point.y - size },
      { x: point.x + size, y: point.y },
      { x: point.x, y: point.y + size },
      { x: point.x - size, y: point.y }
    ];
    const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    diamond.setAttribute('points', diamondPath.map(p => `${p.x},${p.y}`).join(' '));
    diamond.setAttribute('fill', color);
    diamond.setAttribute('stroke', 'white');
    diamond.setAttribute('stroke-width', '1');
    return diamond;
  };

  // Helper: Create constraint label
  this.createConstraintLabel = function(waypoints, constraintType, color) {
    const midPoint = this.getMidPoint(waypoints);
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', midPoint.x);
    label.setAttribute('y', midPoint.y - 8);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-family', 'Arial, sans-serif');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('fill', color);
    label.setAttribute('stroke', 'white');
    label.setAttribute('stroke-width', '2');
    label.setAttribute('paint-order', 'stroke');
    label.textContent = constraintType || 'CONSTRAINT';
    return label;
  };

  // Store reference for dynamic updates
  this.storeConstraintReference = function(element, constraintGroup, constraintType, color) {
    const line = constraintGroup.querySelector('line') || constraintGroup.querySelector('path');
    const dot = constraintGroup.querySelector('circle');
    const arrow = constraintGroup.querySelector('polygon');
    const label = constraintGroup.querySelector('text');

    renderedConstraints.set(element.id, {
      group: constraintGroup,
      line: line,
      dot: dot,
      arrow: arrow,
      label: label,
      element: element,
      constraintType: constraintType,
      currentColor: color
    });

    console.log(`[ConstraintRenderer] Stored constraint flow: ID=${element.id}, Type=${constraintType}`);
  };

  // Helper function to find the midpoint of the connection
  this.getMidPoint = function(waypoints) {
    if (waypoints.length === 2) {

      // Simple case: straight line
      return {
        x: (waypoints[0].x + waypoints[1].x) / 2,
        y: (waypoints[0].y + waypoints[1].y) / 2
      };
    } else {

      // Multiple waypoints: find the middle waypoint or interpolate
      const midIndex = Math.floor(waypoints.length / 2);
      return waypoints[midIndex];
    }
  };

  // Set up event listeners for constraint status changes
  this.setupConstraintStatusListener = function() {
    const self = this;

    console.log('[ConstraintRenderer] Setting up constraint status listeners...');

    // Listen for the main constraint status change event
    eventBus.on('constraint.status.changed', function(event) {
      console.log('[ConstraintRenderer] Received constraint status event:', event);
      console.log('[ConstraintRenderer] Available constraint IDs:', Array.from(renderedConstraints.keys()));

      // Try to update by constraint flow ID first, then by type
      if (event.constraintFlowId) {
        self.updateConstraintColorById(event.constraintFlowId, event.color, event.status);
      } else if (event.constraintType) {
        self.updateConstraintColorByType(event.constraintType, event.color, event.status);
      }
    });

    // Listen for specific constraint status events for more granular control
    eventBus.on('constraint.satisfied', function(event) {
      console.log('[ConstraintRenderer] Constraint satisfied:', event.constraintType);
      if (event.constraintFlowId) {
        self.updateConstraintColorById(event.constraintFlowId, event.color, 'satisfied');
      } else if (event.constraintType) {
        self.updateConstraintColorByType(event.constraintType, event.color, 'satisfied');
      }
    });

    eventBus.on('constraint.violated', function(event) {
      console.log('[ConstraintRenderer] Constraint violated:', event.constraintType);
      if (event.constraintFlowId) {
        self.updateConstraintColorById(event.constraintFlowId, event.color, 'violated');
      } else if (event.constraintType) {
        self.updateConstraintColorByType(event.constraintType, event.color, 'violated');
      }
    });

    eventBus.on('constraint.temporary_satisfied', function(event) {
      console.log('[ConstraintRenderer] Constraint temporarily satisfied:', event.constraintType);
      if (event.constraintFlowId) {
        self.updateConstraintColorById(event.constraintFlowId, event.color, 'temporary_satisfied');
      } else if (event.constraintType) {
        self.updateConstraintColorByType(event.constraintType, event.color, 'temporary_satisfied');
      }
    });

    eventBus.on('constraint.temporary_violated', function(event) {
      console.log('[ConstraintRenderer] Constraint temporarily violated:', event.constraintType);
      if (event.constraintFlowId) {
        self.updateConstraintColorById(event.constraintFlowId, event.color, 'temporary_violated');
      } else if (event.constraintType) {
        self.updateConstraintColorByType(event.constraintType, event.color, 'temporary_violated');
      }
    });
  };

  // Update the color of a specific constraint flow by ID
  this.updateConstraintColorById = function(constraintFlowId, newColor, status) {
    console.log(`[ConstraintRenderer] Attempting to update constraint by ID: ${constraintFlowId}`);

    if (!constraintFlowId || !renderedConstraints.has(constraintFlowId)) {
      console.log('[ConstraintRenderer] No rendered constraint found for ID:', constraintFlowId);
      console.log('[ConstraintRenderer] Available constraint IDs:', Array.from(renderedConstraints.keys()));
      return;
    }

    const constraintData = renderedConstraints.get(constraintFlowId);
    console.log(`[ConstraintRenderer] Updating constraint flow '${constraintFlowId}' (type: ${constraintData.constraintType}) to color '${newColor}' (status: ${status})`);

    constraintData.currentColor = newColor;
    this.updateConstraintVisuals(constraintData, newColor, status);
  };

  // Update the color of all constraint flows of a specific type
  this.updateConstraintColorByType = function(constraintType, newColor, status) {
    console.log(`[ConstraintRenderer] Attempting to update constraints by type: ${constraintType}`);

    const matchingConstraints = [];
    renderedConstraints.forEach((data, id) => {
      if (data.constraintType === constraintType) {
        matchingConstraints.push({ id, data });
      }
    });

    if (matchingConstraints.length === 0) {
      console.log('[ConstraintRenderer] No rendered constraints found for type:', constraintType);
      return;
    }

    console.log(`[ConstraintRenderer] Updating ${matchingConstraints.length} constraint flows of type '${constraintType}' to color '${newColor}' (status: ${status})`);

    matchingConstraints.forEach(({ id, data }) => {
      data.currentColor = newColor;
      this.updateConstraintVisuals(data, newColor, status);
    });
  };

  // Helper method to update the visual elements of a constraint
  this.updateConstraintVisuals = function(constraintData, newColor, status) {
    try {

      // Update all line colors (handles single, double, and triple lines)
      const lines = constraintData.group.querySelectorAll('line, path');
      lines.forEach(line => {

        // Don't change the color of red cross lines in absence constraints
        if (line.getAttribute('stroke') !== 'red') {
          line.style.stroke = newColor;
        }
      });

      // Update all dot colors (handles multiple dots)
      const dots = constraintData.group.querySelectorAll('circle');
      dots.forEach(dot => {
        dot.setAttribute('fill', newColor);
      });

      // Update all arrow colors (handles multiple arrows)
      const arrows = constraintData.group.querySelectorAll('polygon');
      arrows.forEach(arrow => {
        arrow.setAttribute('fill', newColor);
      });

      // Update all label colors
      const labels = constraintData.group.querySelectorAll('text');
      labels.forEach(label => {
        label.setAttribute('fill', newColor);
      });

      // Update constraint box borders
      const boxes = constraintData.group.querySelectorAll('rect');
      boxes.forEach(box => {
        box.setAttribute('stroke', newColor);
      });

      // Add a visual indicator for the status (optional: add a glow effect)
      if (status === 'violated') {
        constraintData.group.style.filter = 'drop-shadow(0 0 4px rgba(220, 53, 69, 0.8))';
      } else if (status === 'satisfied') {
        constraintData.group.style.filter = 'drop-shadow(0 0 4px rgba(40, 167, 69, 0.8))';
      } else if (status === 'temporary_violated') {
        constraintData.group.style.filter = 'drop-shadow(0 0 4px rgba(253, 126, 20, 0.8))';
      } else if (status === 'temporary_satisfied') {
        constraintData.group.style.filter = 'drop-shadow(0 0 4px rgba(255, 193, 7, 0.8))';
      } else {
        constraintData.group.style.filter = 'none';
      }

    } catch (error) {
      console.error('[ConstraintRenderer] Error updating constraint element:', error);
    }
  };

  // Method to get current constraint statuses (for debugging)
  this.getConstraintStatuses = function() {
    const statuses = {};
    renderedConstraints.forEach((data, constraintId) => {
      statuses[constraintId] = {
        constraintType: data.constraintType,
        color: data.currentColor
      };
    });
    return statuses;
  };

  // Method to reset all constraints to default color
  this.resetConstraintColors = function() {
    console.log('[ConstraintRenderer] Resetting all constraint colors to default');
    renderedConstraints.forEach((data, constraintId) => {
      this.updateConstraintColorById(constraintId, DEFAULT_CONSTRAINT_COLOR, 'default');
    });
  };

  // Method to get all rendered constraints (for panel integration)
  this.getRenderedConstraints = function() {
    const constraints = [];
    renderedConstraints.forEach((data, id) => {
      constraints.push({
        id: id,
        constraintType: data.constraintType,
        element: data.element,
        currentColor: data.currentColor
      });
    });
    return constraints;
  };

  // Initialize event listeners after all methods are defined
  this.setupConstraintStatusListener();
}

inherits(ConstraintRenderer, BaseRenderer);

ConstraintRenderer.$inject = [ 'eventBus', 'bpmnRenderer' ];