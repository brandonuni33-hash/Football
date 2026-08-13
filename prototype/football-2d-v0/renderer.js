import { FIELD } from "./football2dModel.js";

function line(ctx,x1,y1,x2,y2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function marker(ctx,entity,fill,stroke,size=18){if(!entity)return;ctx.fillStyle="#0005";ctx.beginPath();ctx.ellipse(entity.x+2,entity.y+10,size+5,7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.beginPath();ctx.arc(entity.x,entity.y,size,0,Math.PI*2);ctx.fill();ctx.stroke();}

export function renderFootball2D(ctx,state,profile,shotPower=0){
  ctx.clearRect(0,0,FIELD.w,FIELD.h);
  ctx.fillStyle="#173e2a";ctx.fillRect(0,0,FIELD.w,FIELD.h);
  ctx.strokeStyle="#dfe9dfaa";ctx.lineWidth=3;ctx.strokeRect(FIELD.inset,FIELD.inset,FIELD.w-FIELD.inset*2,FIELD.h-FIELD.inset*2);
  line(ctx,FIELD.w/2,FIELD.inset,FIELD.w/2,FIELD.h-FIELD.inset);
  ctx.beginPath();ctx.arc(FIELD.w/2,FIELD.h/2,70,0,Math.PI*2);ctx.stroke();
  ctx.strokeRect(FIELD.goalX-135,FIELD.goalTop-55,135,FIELD.goalBottom-FIELD.goalTop+110);
  ctx.strokeStyle="#f3bd41";ctx.lineWidth=5;line(ctx,FIELD.goalX,FIELD.goalTop,FIELD.goalX,FIELD.goalBottom);
  ctx.strokeStyle="#f3bd4155";ctx.lineWidth=2;for(let x=FIELD.goalX;x<FIELD.w;x+=10)line(ctx,x,FIELD.goalTop,x,FIELD.goalBottom);

  marker(ctx,state.defender,"#b8bec6","#4b1118",18);
  marker(ctx,state.keeper,"#e9a33b","#442b08",20);

  const p=state.player;const angle=Math.atan2(p.facingY,p.facingX);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);
  ctx.fillStyle="#0006";ctx.beginPath();ctx.ellipse(-2,13,25,10,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#11161d";ctx.beginPath();ctx.ellipse(0,0,22*profile.bodyScale,16,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#e3b341";ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle=profile.skinColor;ctx.beginPath();ctx.arc(13,0,10,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=profile.hairCssColor;ctx.beginPath();ctx.arc(10,-2,10,Math.PI,Math.PI*2);ctx.fill();
  if(profile.headAccessory!=="none"){ctx.strokeStyle=profile.accessoryColor;ctx.lineWidth=3;ctx.beginPath();ctx.arc(11,0,9,-2.5,-.55);ctx.stroke();}
  ctx.fillStyle="#f4f4f1";ctx.font="900 13px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(profile.number),-3,0);
  ctx.restore();

  if(state.possession){ctx.strokeStyle=`rgba(242,189,66,${.18+.42*shotPower})`;ctx.lineWidth=2;line(ctx,p.x,p.y,p.x+p.facingX*(70+shotPower*35),p.y+p.facingY*(70+shotPower*35));}

  const b=state.ball;ctx.fillStyle="#0005";ctx.beginPath();ctx.ellipse(b.x+3,b.y+7,10,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#f6f6f2";ctx.beginPath();ctx.arc(b.x,b.y,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#20242a";ctx.lineWidth=2;ctx.stroke();
}
