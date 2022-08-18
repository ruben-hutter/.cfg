"use strict";(self.webpackChunknotion_next=self.webpackChunknotion_next||[]).push([[827],{51490:(e,t,i)=>{i.d(t,{ZP:()=>K,UV:()=>q,f4:()=>N});var n=i(77094),o=i.n(n),a=i(67294),r=i.n(a),s=i(84619),d=i(5366),l=i(47307),c=i(72693),m=(i(33948),i(480)),u=i(28350),g=i(24405),p=i(97880),f=i(50906),v=i(61269),y=i(52507),h=i(15102),b=i(97464),x=i.n(b),S=i(13991),M=i(82990),k=i(62727),w=i(68932),C=i(47966),D=i(46951);const Z=(0,d.defineMessages)({samlConfigSubtitle:{id:"verifyDomainModal.addNewDomain.samlConfig.subtitle",defaultMessage:"Users with a verified domain can log in {br}using SAML SSO.",description:"Modal subtitle indicating the content is about adding a new domain."},integrationSubtitle:{id:"verifyDomainModal.addNewDomain.integration.subtitle",defaultMessage:"Link preview integrations must verify {br}domains before they are published.",description:"Modal title indicating the content is about adding a new domain."}});const F=function(e){let{handleAddNewDomain:t,loading:i,verificationType:n}=e;const[s,l]=(0,a.useState)(""),c=(0,a.useCallback)((e=>{l(e.target.value)}),[]),m=(0,g.y)((()=>({title:{fontFamily:M.Z.getCompositeFontFamily(S.SP).sans,fontSize:17,fontWeight:500,lineHeight:"24px",textAlign:"center",marginBottom:8},subtitle:{fontFamily:M.Z.getCompositeFontFamily(S.SP).sans,fontSize:14,fontWeight:400,lineHeight:"19px",textAlign:"center"},input:{marginTop:22,marginBottom:14}})),[]);let u;switch(n){case"integration":u=Z.integrationSubtitle;break;case"saml_config":u=Z.samlConfigSubtitle;break;default:(0,p.t1)(n)}return o()(a.Fragment,{},void 0,o()(D.Z,{style:m.title},void 0,o()(d.FormattedMessage,{id:"verifyDomainModal.addNewDomain.title",defaultMessage:"Add new domain",description:"Modal title indicating the content is about adding a new domain."})),o()(D.Z,{style:m.subtitle,isMultiline:!0},void 0,r().createElement(d.FormattedMessage,x()({},u,{values:{br:o()("br",{})}}))),o()(k.Z,{value:s,style:m.input,placeholder:"notion.so",onChange:c}),o()(C.Z,{onClick:()=>t(s),style:{width:"100%"},isBlue:Boolean(s),disabled:!Boolean(s)},void 0,i?o()(w.Z,{}):o()(d.FormattedMessage,{id:"verifyDomainModal.addNewDomain.next",defaultMessage:"Next",description:"Text for the next button."})))};const T=function(e){let{domain:t,isExpired:i,onClose:n}=e;const r=(0,g.y)((e=>({title:{fontFamily:M.Z.getCompositeFontFamily(S.SP).sans,fontSize:17,fontWeight:500,lineHeight:"24px",textAlign:"center",marginBottom:8},subtitle:{fontFamily:M.Z.getCompositeFontFamily(S.SP).sans,fontSize:14,fontWeight:400,lineHeight:"19px",textAlign:"center",marginBottom:22}})),[]);return o()(a.Fragment,{},void 0,o()(D.Z,{style:r.title,isMultiline:!0},void 0,o()(d.FormattedMessage,{id:"verifyDomainModal.invalidDomain.title",defaultMessage:"Unable to verify {domain}",description:"Modal title indicating the content is about the domain being invalid.",values:{domain:t}})),o()(D.Z,{style:r.subtitle,isMultiline:!0},void 0,o()(d.FormattedMessage,i?{id:"verifyDomainModal.invalidDomain.expired",defaultMessage:"The code for this domain's verification has expired.",description:"Modal subtitle indicating that the domain is expired."}:{id:"verifyDomainModal.invalidDomain.invalid",defaultMessage:"You are unable to verify this domain because it has already been verified by another workspace.",description:"Modal subtitle indicating that the domain is invalid."})),o()(C.Z,{onClick:n,style:{width:"100%"}},void 0,o()(d.FormattedMessage,{id:"verifyDomainModal.invalidDomain.okay",defaultMessage:"Okay",description:"Text for the okay button."})))},A=(0,d.defineMessages)({samlConfigSubtitle:{id:"verifyDomainModal.verifiedDomain.samlConfig.subtitle",defaultMessage:"Users are able to use this email domain to{br}log in using SAML SSO.",description:"Modal subtitle indicating the content is about verified saml config email domains."},integrationSubtitle:{id:"verifyDomainModal.verifiedDomain.integration.subtitle",defaultMessage:"This integration can unfurl URLs containing this domain.",description:"Modal subtitle indicating link preview integrations can use this domain."}});const I=function(e){let{domain:t,onClose:i,verificationType:n}=e;const s=(0,g.y)((()=>({title:{fontFamily:M.Z.getCompositeFontFamily(S.SP).sans,fontSize:17,fontWeight:500,lineHeight:"24px",textAlign:"center",marginBottom:8},subtitle:{fontFamily:M.Z.getCompositeFontFamily(S.SP).sans,fontSize:14,fontWeight:400,lineHeight:"19px",textAlign:"center",marginBottom:22}})),[]);let l;switch(n){case"saml_config":l=A.samlConfigSubtitle;break;case"integration":l=A.integrationSubtitle;break;default:(0,p.t1)(n)}return o()(a.Fragment,{},void 0,o()(D.Z,{style:s.title,isMultiline:!0},void 0,o()(d.FormattedMessage,{id:"verifyDomainModal.verifiedDomain.title",defaultMessage:"Successfully verified {domain}",description:"Modal title indicating the content is about adding a new domain.",values:{domain:t}})),o()(D.Z,{style:s.subtitle,isMultiline:!0},void 0,r().createElement(d.FormattedMessage,x()({},l,{values:{br:o()("br",{})}}))),o()(C.Z,{onClick:i,style:{width:"100%"}},void 0,o()(d.FormattedMessage,{id:"verifyDomainModal.verifiedDomain.okay",defaultMessage:"Okay",description:"Text for the okay button."})))};var B=i(3779),E=i(63143),P=i(66055),V=i(16402),O=i(14947);const R=function(e){let{handleVerifyDomain:t,domainVerification:i,loading:n}=e;const r=(0,m.O7)(),s=i.expiresAt-Date.now()<2*E.U6,l=(0,g.y)((e=>({title:{fontFamily:M.Z.getCompositeFontFamily(S.SP).sans,fontSize:17,fontWeight:500,lineHeight:"24px",textAlign:"center",marginBottom:8},subtitle:{fontFamily:M.Z.getCompositeFontFamily(S.SP).sans,fontSize:14,fontWeight:400,lineHeight:"19px",textAlign:"center"},list:{paddingInlineStart:22,margin:"24px 0"},listItem:{fontFamily:M.Z.getCompositeFontFamily(S.SP).sans,fontSize:14,fontWeight:400,lineHeight:"19px",marginBottom:12},expiresSoonText:{color:"dark"===e.mode?e.accentColors.red[700]:e.accentColors.red[500]},copyButton:{borderRadius:3,padding:"4px 8px",display:"flex",alignItems:"center",justifyContent:"center",color:e.lightTextColor,fontFamily:M.Z.getCompositeFontFamily(S.SP).sans,fontSize:12,fontWeight:500,lineHeight:"14px"},copyIcon:{width:16,height:16,marginRight:4,fill:e.mediumIconColor},code:{width:"100%",color:e.mediumTextColor,fontFamily:M.Z.getCompositeFontFamily(S.SP).mono,fontSize:14,fontWeight:400,lineHeight:"18px"},codeContainer:{display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid ".concat(e.outlineButtonBorder),height:32,paddingLeft:12,paddingRight:12,borderRadius:3,marginTop:4,marginBottom:8}})),[]);return o()(a.Fragment,{},void 0,o()(D.Z,{style:l.title},void 0,o()(d.FormattedMessage,{id:"verifyDomainModal.verifyExistingDomain.title",defaultMessage:"Verify your domain",description:"Modal title indicating the content is about verifying a domain."})),o()(D.Z,{style:l.subtitle},void 0,o()(d.FormattedMessage,{id:"verifyDomainModal.verifyExistingDomain.subtitle",defaultMessage:"Follow these steps to finalize verification.",description:"Modal subtitle indicating the content is about verifying a domain."})),o()(D.Z,{isSmall:!0,style:{marginTop:22}},void 0,o()(d.FormattedMessage,{id:"verifyDomainModal.verifyExistingDomain.verificationCodeLabel",defaultMessage:"Verification code",description:"Label for the verification code."})),o()("div",{style:l.codeContainer},void 0,o()(D.Z,{style:l.code},void 0,"notion-domain-verification=".concat(i.verificationCode)),o()(O.Z,{onClick:function(){P.RD({environment:r,stringValue:"notion-domain-verification=".concat(i.verificationCode),copiedMessage:P.tq.copiedLinkToClipboard})},style:l.copyButton},void 0,B.Z.copy(l.copyIcon),o()(d.FormattedMessage,{id:"verifyDomainModal.verifyExistingDomain.copy",defaultMessage:"Copy",description:"Button for copying the content of the verification code."}))),o()(D.Z,{style:s?l.expiresSoonText:void 0,isSmall:!0},void 0,o()(d.FormattedMessage,{id:"verifyDomainModal.verifyExistingDomain.verificationCodeExpiresAt",defaultMessage:"Expires on {timeLeft}",description:"Label explaining how much time is left before the code expires.",values:{timeLeft:(0,V.gs)(i.expiresAt)}})),o()("ol",{style:l.list},void 0,o()("li",{style:l.listItem},void 0,o()(d.FormattedMessage,{id:"verifyDomainModal.verifyExistingDomain.instructionsDNS",defaultMessage:"Navigate to the DNS record section of your domain host.",description:"An instructional step explaining to navigate to DNS record section of the domain host."})),o()("li",{style:l.listItem},void 0,o()(d.FormattedMessage,{id:"verifyDomainModal.verifyExistingDomain.instructionsTXT",defaultMessage:"Create a new TXT record and paste in the code above as the value.",description:"An instructional step explaining to use the code we provide for the TXT record."})),o()("li",{style:l.listItem},void 0,o()(d.FormattedMessage,{id:"verifyDomainModal.verifyExistingDomain.instructionsHangTight",defaultMessage:"Typically, this change takes only minutes to occur, however, there are cases where it may take up to 72 hours for the DNS record to propagate.",description:"An instructional step explaining that DNS changes can take time to reflect changes."})),o()("li",{style:l.listItem},void 0,o()(d.FormattedMessage,{id:"verifyDomainModal.verifyExistingDomain.instructionsVerify",defaultMessage:'Click "Verify" to notify Notion to check your DNS record.',description:"An instructional step explaining to click the verify button when the changes have been reflected."}))),o()(C.Z,{style:{width:"100%"},onClick:()=>t(i),disabled:n},void 0,n?o()(w.Z,{}):o()(d.FormattedMessage,{id:"verifyDomainModal.verifyExistingDomain.verify",defaultMessage:"Verify",description:"Text for the verify button."})))};const z=function(e){const t=(0,m.O7)(),i=(0,g.F)(),[n,r]=(0,u.oR)(e.store,y.ZP),{verificationType:s,verificationTargetId:d,refreshDomains:c}=e,b=(0,a.useCallback)((()=>{r((e=>({...e,loading:!1,modalOpen:!1})))}),[r]),x=(0,a.useCallback)((async e=>{r((e=>({...e,loading:!0})));const i="integration"===s?{type:s,integrationId:d,domain:e}:{type:s,spaceId:d,domain:e},n=await v.createDomainVerificationCode(t,i);if("success"===n.type){c(),f.G7$(t,{type:s});const e=n.data.domainVerification,i={type:"unverified",id:e.id,domain:e.domain,verificationCode:e.verification_code,createdAt:e.created_at,expiresAt:e.expires_at};"saml_config"===e.type&&(i.invalidatedAt=e.info.invalidated_at),r((e=>({...e,domainVerification:i,loading:!1})))}else l.showErrorMessage(n.error.message),r((e=>({...e,loading:!1})))}),[t,r,d,c,s]),S=(0,a.useCallback)((async e=>{r((e=>({...e,loading:!0})));const i=await v.verifyDomain(t,{verificationId:e.id});if(f.DoK(t,{type:s}),"success"===i.type){c(),f.aOs(t,{type:s});const i={type:"verified",domain:e.domain};r((e=>({...e,domainVerification:i,loading:!1})))}else l.showErrorMessage(i.error.message),r((e=>({...e,loading:!1})))}),[t,r,c,s]),M=(0,a.useCallback)((()=>{if(!n.domainVerification)return o()(F,{handleAddNewDomain:x,loading:n.loading,verificationType:s});switch(n.domainVerification.type){case"invalid":return o()(T,{domain:n.domainVerification.domain,isExpired:Date.now()>n.domainVerification.expiresAt,onClose:b});case"unverified":return o()(R,{handleVerifyDomain:S,domainVerification:n.domainVerification,loading:n.loading});case"verified":return o()(I,{domain:n.domainVerification.domain,onClose:b,verificationType:s});default:(0,p.t1)(n.domainVerification)}}),[n.domainVerification,n.loading,S,x,b,s]);return o()(h.Z,{open:n.modalOpen,onDismiss:b,render:()=>o()("div",{style:{background:i.popoverBackground,width:410,padding:24,borderRadius:3}},void 0,M())})};var W=i(5478),H=i(719);const U=(0,d.defineMessages)({securitySAMLSettings:{defaultMessage:"Deleting this domain will prevent others with this email from logging in using SSO if this domain has been verified.",id:"domainVerificationInput.securitySAMLSettings.emailDomainsSection.removeDomain.description",description:"Description about what will happen when you delete a SAML SSO domain."},integrations:{defaultMessage:"Deleting this domain (if verified) will prevent integrations from unfurling urls that contain this domain.",id:"domainVerificationInput.myIntegrations.emailDomainsSection.removeDomain.description",description:"Description about what will happen when you delete an unfurling integration domain."}}),L={fontSize:17,fontWeight:500,lineHeight:"24px",textAlign:"center",marginBottom:8},_={fontSize:14,fontWeight:400,lineHeight:"19px",textAlign:"center"};function N(e){return{domain:e,status:W.YF.Success,data:{type:"verified",domain:e}}}function q(e){return Date.now()>e.expiresAt||Boolean(e.invalidatedAt)?{domain:e.domain,status:W.YF.Failure,data:{type:"invalid",id:e.id,domain:e.domain,verificationCode:e.verificationCode,createdAt:e.createdAt,expiresAt:e.expiresAt,invalidatedAt:e.invalidatedAt}}:{domain:e.domain,status:W.YF.Pending,data:{type:"unverified",id:e.id,domain:e.domain,verificationCode:e.verificationCode,createdAt:e.createdAt,expiresAt:e.expiresAt,invalidatedAt:e.invalidatedAt}}}const K=function(e){const t=(0,d.useIntl)(),{disabled:i,domains:n,domainVerificationStore:m,verificationType:u,verificationTargetId:g,refreshDomains:p,onRemoveDomain:f,onClickAddDomain:v}=e,y={[W.YF.Success]:()=>o()(d.FormattedMessage,{defaultMessage:"Verified",id:"domainVerificationInput.emailDomainsSection.statusToken.verified",description:"Shown in a tooltip when hovering over a verified domain."}),[W.YF.Pending]:()=>o()(d.FormattedMessage,{defaultMessage:"Not verified",id:"domainVerificationInput.emailDomainsSection.statusToken.notVerified",description:"Shown in a tooltip when hovering over an unverified domain."}),[W.YF.Failure]:()=>o()(d.FormattedMessage,{defaultMessage:"Invalid",id:"domainVerificationInput.emailDomainsSection.statusToken.invalid",description:"Shown in a tooltip when hovering over a invalid domain."})},h=n.map((e=>{let{domain:t,status:n,data:a}=e;return o()(W.ZP,{status:n,showRemoveButton:!i,onClickRemove:async()=>{const e="saml_config"===u?U.securitySAMLSettings:U.integrations;await l.confirmUserAction({message:o()("div",{style:L},void 0,o()(d.FormattedMessage,{defaultMessage:"Are you sure you want to delete this domain?",id:"domainVerificationInput.emailDomainsSection.removeDomain.message",description:"Title asking the user if they are sure they want to delete this domain."})),description:o()("div",{style:_},void 0,r().createElement(d.FormattedMessage,e)),acceptLabel:o()(d.FormattedMessage,{id:"domainVerificationInput.emailDomainsSection.removeDomain.accept",defaultMessage:"Delete domain",description:"Button for accepting the delete domain workflow."}),cancelLabel:o()(d.FormattedMessage,{id:"domainVerificationInput.emailDomainsSection.removeDomain.cancel",defaultMessage:"Cancel",description:"Button for canceling the delete domain workflow."})})&&f(a)},onClick:i?void 0:()=>{m.setState({domainVerification:a,loading:!1,modalOpen:!0})},renderTooltip:y[n],isSingle:!1,format:s.l.Medium,value:t},"verified"===a.type?t:a.id)}));return o()(a.Fragment,{},void 0,o()(c.Z,{isLarge:!0,disabled:i,onClick:()=>{i||(v&&v(),m.setState({domainVerification:void 0,loading:!1,modalOpen:!0}))},style:{margin:"4px 0px 16px",width:"fit-content"}},void 0,o()(d.FormattedMessage,{defaultMessage:"Add domain",id:"securitySAMLSettings.emailDomainsSection.addDomain",description:"Button for adding a new domain verification record."})),o()("div",{style:{height:32}},void 0,o()(H.Z,{placeholder:t.formatMessage({id:"domainVerificationInput.domainInput.placeholder",defaultMessage:"No domains configured",description:"Placeholder input for adding new domains."}),value:"",onChange:()=>{},onRemoveLastToken:()=>{},readOnly:!0,tokens:h})),o()(z,{store:m,verificationTargetId:g,verificationType:u,refreshDomains:p}))}},67206:(e,t,i)=>{i.d(t,{s:()=>ne,D:()=>ce});var n=i(97464),o=i.n(n),a=i(77094),r=i.n(a),s=(i(33948),i(96486)),d=i.n(s),l=i(67294),c=i.n(l),m=i(1302),u=i(480),g=i(28350),p=i(24405),f=i(57269),v=i(66673),y=i(3779),h=i(64572),b=i(76725),x=i(21202),S=i(70203),M=i(44805),k=i(82990),w=i(44876),C=i(5366),D=i(18258),Z=i(66055),F=i(45990),T=i(77100),A=i(25103),I=i(8646),B=i(89314),E=i(95477),P=i(17731),V=i(73744),O=i(41232),R=i(6398),z=i(88804),W=i(9714),H=i(96049),U=i(42653),L=i(48588),_=i(58945),N=i(19757),q=i(14947),K=i(46167),j=i(40662),Y=i(92452),G=i(80527),X=i(4637),$=i(29551),J=i(71202),Q=i(25584),ee=i(66722),te=i(79029),ie=i(83071);function ne(e){const t=(0,g.Kw)(H.Z,{debugName:"HoverPreviewOverlay"}),{state:i,pinPopup:n,unpinPopup:o,hasBeenHovering:a,isPinned:s}=function(){const[e]=(0,g.oR)(L.Z),t=(0,v.Kt)(e,400,Object.is),[i,n]=(0,l.useState)(void 0),o=i||t,a=(0,l.useCallback)((()=>n(o)),[o]),r=(0,l.useCallback)((()=>{n(void 0)}),[]);return{state:o,pinPopup:a,unpinPopup:r,hasBeenHovering:e&&e===o,isPinned:Boolean(i)}}(),d=function(e){const t=(0,u.O7)();return(0,g.VK)((()=>!!e&&(0,z.E)(t,e.store)),[e,t])}(i),c=(0,l.useMemo)((()=>Boolean(i&&function(e,t){return t&&(e.annotations.some(S.j0)||e.annotations.some(S.nS))}(i,d))),[i,d]),m=!!c||Boolean(!t&&a),p=(0,l.useMemo)((()=>i&&i.token.node.getBoundingClientRect()),[i]),[,f]=(0,g.oR)(U.Z);(0,l.useEffect)((()=>(f({isPinned:s}),()=>f({isPinned:!1}))),[s,f]);const y=!(null!=i&&i.annotations.some(S.nS));return r()(ee.ZP,{disableMouseCapture:!0,preventCaptureEsc:!0,preventPointerEvents:!c,preventScaleTransition:!0,preventOpacityTransition:!0,popupType:ee.ZP.PopupType.Popup,open:m,originRect:p,originGap:8,alignmentToOrigin:ee.ZP.Alignment.Start,placementToOrigin:ee.ZP.Placement.Bottom,useLightBoxShadow:y,render:()=>i&&r()("div",{onMouseEnter:n,onMouseLeave:o},void 0,r()(oe,{state:i,isHoveredTokenEditable:d,onDismiss:o}))})}function oe(e){(0,l.useEffect)((()=>{const e=d().throttle(A.l,200,{leading:!0});return V.l(window,"scroll",e,!0),()=>V.Z(window,"scroll",e,!0)}),[]);const t=(0,u.Fy)(),i=e.state.annotations,n=i.find(S.j0),a=i.find(S.fp),r=i.find(S.aq),s=S.fr(i);return n?c().createElement(ae,o()({},e,{state:{...e.state,annotation:n}})):a?c().createElement(re,o()({},e,{state:{...e.state,annotation:a}})):r?c().createElement(se,o()({},e,{state:{...e.state,annotation:r}})):s&&!t.isMobile&&"production"!==E.default.env?c().createElement(ce,o()({},e,{state:{...e.state,annotation:s},onDismiss:e.onDismiss})):null}function ae(e){const{onDismiss:t}=e,{annotation:i,store:n,token:o}=e.state,a=(0,u.O7)(),s=S.zW(i),d=(0,h.A5)({url:s,baseUrl:E.default.domainBaseUrl,publicDomainName:E.default.publicDomainName}),c=(0,l.useCallback)((async()=>{t(),T.AE({token:o,store:n,readOnly:!1}),await m.default.afterNextFlush(),F.dz({type:"focusOnly",focus:!0})}),[t,n,o]),f=(0,l.useCallback)((async()=>{t(),await m.default.afterNextFlush();const e=Z.tq.copiedLinkToClipboard;(0,Z.RD)({environment:a,stringValue:s,copiedMessage:e})}),[a,t,s]),v=(0,p.y)((e=>({wrapper:{fontSize:k.Z.fontSize.UISmall.desktop,color:e.mediumTextColor,fontWeight:k.Z.fontWeight.regular,fill:e.mediumIconColor},destination:{padding:"4px 0 4px 6px"},button:{display:"flex",alignItems:"center",padding:"2px 6px",whiteSpace:"nowrap",marginRight:2,borderRadius:3,color:e.regularTextColor},destinationText:{paddingRight:6,maxWidth:250,...k.Z.textOverflowStyle},icon:{height:"1em",width:"1em",marginRight:"0.25em",fill:e.mediumIconColor}})),[]),b=(0,g.VK)((()=>{if(!d)return;const e=W.Z.createChildStore(n,{table:x.iU,id:d});return{pageIcon:(0,M.tp)({pageValue:e.getValue(),pageRole:e.getRole(),baseUrl:E.default.domainBaseUrl,getRecordValue:n.getRecordValue,emojiType:(0,P.e)(a),isSafariOrIOS:a.device.isSafari||a.device.isIOS,isClient:!0,showEmojiInline:a.device.isWindows,currentUserId:a.currentUser.id,theme:a.ThemeModeStore.state}),title:r()(te.Z,{style:v.destinationText,store:e})}}),[a,n,d,v])||{pageIcon:y.Z.globe2(v.icon),title:r()("div",{style:v.destinationText},void 0,s)};return r()($.gq,{style:v.wrapper,alignItems:"center"},void 0,r()($.gq,{style:v.destination,alignItems:"center"},void 0,b.pageIcon,b.title),r()(G.Z,{onClick:f,icon:y.Z.copy,isDarkIconColor:!0}),e.isHoveredTokenEditable&&r()(q.Z,{style:v.button,onClick:c},void 0,r()(C.FormattedMessage,{defaultMessage:"Edit",id:"hoverPreviewOverlay.editButton.label"})))}function re(e){const{annotation:t}=e.state,i=S.Ot(t),n=(0,p.y)((e=>({container:{fontSize:k.Z.fontSize.UISmall.desktop,color:e.mediumTextColor,padding:"4px 8px"},icon:{height:"1em",width:"1em",marginRight:"0.25em",fill:e.mediumIconColor}})),[]),o=(0,C.useIntl)(),a="relative"===i.date_format?"ll":"relative",s=(0,f.ZV)({value:i,date_format:a,time_format:"h:mm A",allowRelativeDates:!0,intl:o});return s===(0,f.ZV)({value:i,date_format:i.date_format,time_format:i.time_format,allowRelativeDates:!0,intl:o})?null:r()($.gq,{style:n.container,alignItems:"center"},void 0,y.Z.calendar(n.icon),r()("div",{style:k.Z.textOverflowStyle},void 0,s))}function se(e){const{annotation:t}=e.state,i=S.fs(t),n=(0,C.useIntl)(),o=S.Z0(i.type,n),a=(0,p.y)((e=>({container:{fontSize:k.Z.fontSize.UISmall.desktop,color:e.mediumTextColor,padding:"4px 8px"}})),[]);return r()($.gq,{style:a.container,alignItems:"center"},void 0,r()("div",{style:k.Z.textOverflowStyle},void 0,o))}function de(e){const{store:t,onAccept:i,onTransformIntoBlock:n}=e,a={blocks:[t],environment:(0,u.O7)(),publicEditMode:void 0},s=e=>({key:e.key,render:(t,n)=>e.render(t,a,{onAccept:i,onFocus:n.onFocus}),action:t=>{let{event:i}=t;return e.action(a,i)}}),d=[s(D.mZ)],l=[{key:"turn preview into block",render:e=>c().createElement(_.Z,o()({},e,{title:r()(C.FormattedMessage,{id:"hoverPreviewOverlay.action.turnPreviewIntoBlock",defaultMessage:"Turn into block",description:"Menu option to convert a link preview from an inline mention into a standalone block"}),svg:y.Z.loop})),action:()=>{n()}},s(D.IK)];return r()(J.ZP,{menuType:J.ZP.MenuType.Popup},void 0,r()(Q.Z,{type:Q.Z.Type.Vertical,initialFocus:void 0,onAccept:i,sections:[{key:0,render:e=>c().createElement(ie.Z,e),items:d},{key:1,render:e=>c().createElement(ie.Z,o()({},e,{topBorder:!0})),items:l}]}))}function le(e){var t,i;const{renderConfig:n,store:a}=e,s=(0,p.y)((e=>({title:{color:e.regularTextColor,fontWeight:k.Z.fontWeight.medium,whiteSpace:"initial"},header:{color:e.mediumTextColor,fontSize:k.Z.fontSize.UISmall.desktop},dictionaryKey:{color:e.mediumTextColor,fontWeight:k.Z.fontWeight.regular,fontSize:k.Z.fontSize.UISmall.desktop},dictionaryValue:{color:e.regularTextColor,fontSize:k.Z.fontSize.UIRegular.desktop,whiteSpace:"normal"}})),[]);return c().createElement(c().Fragment,null,n.title&&r()($.gq,{},void 0,c().createElement(R.ox,o()({},n.title,{store:a,style:s.title}))),n.headerAttributes&&n.headerAttributes.length>0&&r()($.gq,{alignItems:"center",style:{...s.header,marginBottom:3}},void 0,(0,b.Z)(n.headerAttributes.map(((e,t)=>c().createElement(R.ox,o()({key:"attribute-".concat(t)},e,{store:a,style:{...s.header,...k.Z.textOverflowStyle}}))))||[],(e=>r()("span",{},"dot-".concat(e)," ","·"," ")))),n.dictionaryAttributes&&n.dictionaryAttributes.length>0&&r()($.Ht,{},void 0,n.dictionaryAttributes.map(((e,t)=>{var i,d;let{key:l,value:m}=e;return r()($.gq,{style:{marginBottom:t!==(null!==(i=null===(d=n.dictionaryAttributes)||void 0===d?void 0:d.length)&&void 0!==i?i:0)-1?3:0}},t,r()("div",{style:{marginRight:10,width:"30%",display:"flex",alignItems:"center",textAlign:"center"}},void 0,r()("span",{style:s.dictionaryKey},void 0,c().createElement(C.FormattedMessage,l.formatter))),r()("div",{style:{width:"70%",display:"flex",alignItems:"center"}},void 0,m.icon&&(0,w.li)(m.icon)&&r()(Y.Z,{type:"image_url",imageURL:m.icon.values[0],size:16,style:{marginRight:4}}),c().createElement(R.ox,o()({},m,{store:a,style:s.dictionaryValue,avatarStyle:{marginRight:4}}))))}))),n.bodyAttribute&&r()($.gq,{style:(null!==(t=null===(i=n.dictionaryAttributes)||void 0===i?void 0:i.length)&&void 0!==t?t:0)>0?{marginTop:3}:{}},void 0,r()(R.hx,{attribute:n.bodyAttribute})),n.previewImageAttribute&&r()("div",{style:{marginTop:n.dictionaryAttributes?6:0,marginBottom:4,display:"flex",justifyContent:"center"}},void 0,r()("div",{},void 0,r()(X.Z,{src:n.previewImageAttribute.values[0],style:{width:"100%",maxHeight:250}}))))}function ce(e){const{state:{annotation:t,store:i,token:n},onDismiss:a}=e,s=S.Ik(t),d=(0,u.O7)(),l=(0,p.F)(),m=(0,g.VK)((()=>{const t=W.Z.createChildStore(i,{table:x.iU,id:s}),m=t.canEdit(),u=(0,O._F)({store:t,isInDarkMode:"dark"===l.mode,canEdit:m,currentUserId:d.currentUser.id,getRenderFn:e=>t=>{var i;return null===(i=e.hover)||void 0===i?void 0:i.call(e,t)},showAction:void 0});if(!u)return;const{renderConfig:g,integration:p}=u,f=Boolean(u.action),v=e.isHoveredTokenEditable,h=i.recordStoreUIParentStore&&i.recordStoreUIParentStore instanceof W.Z?i.recordStoreUIParentStore:void 0;return r()($.Ht,{},void 0,r()($.gq,{alignItems:"center",style:{fontSize:12}},void 0,r()(Y.Z,{type:"image_url",imageURL:p.icon,size:16,style:{marginRight:"4px"}}),r()("div",{style:{flexGrow:1,fontWeight:k.Z.fontWeight.medium}},void 0,p.name),n&&!f&&v&&r()("div",{},void 0,r()(K.Z,{popupType:K.Z.PopupType.Popup,placementToOrigin:N.ug.Right,alignmentToOrigin:N.v2.Start,originGap:4,renderOrigin:e=>c().createElement(q.Z,o()({style:{display:"flex",alignItems:"center",justifyContent:"center",width:20,height:20,borderRadius:3}},e),y.Z.dots({width:14})),render:e=>r()(de,{store:t,onAccept:()=>e.close(),onTransformIntoBlock:()=>{h&&I.createAndCommit({userAction:"HoverPreviewOverlay.transformExternalObjectInstanceMentionIntoBlock",environment:d,perform:e=>{B.aV({block:t,parentStore:h,transaction:e,token:n}),e.postSubmitCallbacks.push((e=>{e||null==a||a()}))}})}})}))),f&&v?r()("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",margin:"6px 0"}},void 0,r()(j.Z,{canEdit:m,store:t,isHoverPreview:!0,postActionCallback:a})):r()(le,{renderConfig:g,store:t}))}),[s,i,d,l,n,a,e.isHoveredTokenEditable]);return m?r()("div",{style:{padding:"8px 16px",minWidth:300,maxWidth:350}},void 0,m):null}},5478:(e,t,i)=>{i.d(t,{YF:()=>g,ZP:()=>f});var n=i(97464),o=i.n(n),a=i(77094),r=i.n(a),s=i(67294),d=i.n(s),l=i(24405),c=i(19757),m=i(85567),u=i(37235);const g={Success:"success",Pending:"pending",Failure:"failure"};const p={display:"flex",justifyContent:"center",alignItems:"baseline"},f=function(e){let{status:t,value:i,renderTooltip:n,...a}=e;const s=(0,l.F)(),f={[g.Success]:s.statusTokenBackground.green,[g.Pending]:s.statusTokenBackground.gray,[g.Failure]:s.statusTokenBackground.red},v={[g.Success]:"dark"===s.mode?s.accentColors.green[700]:s.accentColors.green[500],[g.Pending]:"dark"===s.mode?s.accentColors.gray[700]:s.accentColors.gray[500],[g.Failure]:"dark"===s.mode?s.accentColors.red[700]:s.accentColors.red[500]},y={[g.Success]:s.accentColors.green[700],[g.Pending]:s.accentColors.gray[700],[g.Failure]:s.accentColors.red[700]};return n?d().createElement(m.Z,o()({},a,{backgroundColor:f[t],color:y[t],value:r()(u.Z,{placement:c.ug.Bottom,alignment:c.v2.Start,renderTooltip:n,render:e=>d().createElement("div",o()({style:p},e),r()("div",{style:{background:v[t],width:8,height:8,borderRadius:"100%",marginRight:4}}),i)})})):d().createElement(m.Z,o()({},a,{backgroundColor:f[t],color:y[t],value:r()("div",{style:p},void 0,r()("div",{style:{background:v[t],width:8,height:8,borderRadius:"100%",marginRight:4}}),i)}))}},719:(e,t,i)=>{i.d(t,{Z:()=>f});var n=i(97464),o=i.n(n),a=i(77094),r=i.n(a),s=i(77422),d=i.n(s),l=(i(33948),i(67294)),c=i.n(l),m=i(83355),u=i(98742),g=i(62727);class p extends m.Z{constructor(){super(...arguments),d()(this,"handleKeyDown",(e=>{"Backspace"===e.key&&0===this.props.value.length&&this.props.onRemoveLastToken()}))}renderComponent(){const{device:e}=this.environment;return r()("div",{onClick:this.props.onClick,style:e.isMobile?this.getMobileWrapStyle():this.getDesktopWrapStyle()},void 0,this.props.tokens,this.renderInput())}renderInput(){const{device:e}=this.environment,t=0===this.props.tokens.length;return c().createElement(g.Z,o()({format:g.Z.Format.Transparent},(0,u.Z)({onKeyDown:this.handleKeyDown},{onChange:this.props.onChange}),{value:this.props.value,onSubmit:this.props.onSubmit,onBlur:this.props.onBlur,focus:this.props.focus,style:{...p.inputStyle,margin:e.isMobile?"0 8px 8px 0":"0 6px 6px 0"},readOnly:this.props.readOnly,inputStyle:{height:18},size:1,type:this.props.type,placeholder:t?this.props.placeholder:"",autoComplete:"off",autoCorrect:"off",autoCapitalize:"off",spellCheck:!1}))}getDesktopWrapStyle(){return{display:"flex",flexWrap:"wrap",alignItems:"flex-start",minHeight:32,boxShadow:this.theme.inputBoxShadow,background:this.theme.inputBackground,borderRadius:3,fontSize:14,cursor:"text",overflow:"hidden",padding:"7px 9px 0px",...this.props.style}}getMobileWrapStyle(){return{...this.getDesktopWrapStyle(),fontSize:14,padding:"7px 10px 0"}}}d()(p,"inputStyle",{flexGrow:1,flexShrink:1,flexBasis:60,minWidth:60,width:"auto",lineHeight:"20px"});const f=p},52507:(e,t,i)=>{i.d(t,{AS:()=>r,Hs:()=>s,ZP:()=>d});var n=i(49085),o=i(97880);class a extends n.Z{getInitialState(){return{modalOpen:!1,loading:!1,domainVerification:void 0}}}const r=(0,o.AO)((e=>"invalid"===e.type||"unverified"===e.type?{true:e}:{false:e}));function s(e){return{type:e.verified_at?"verified":"unverified",id:e.id,domain:e.domain,verificationCode:e.verification_code,createdAt:e.created_at,expiresAt:e.expires_at}}const d=a}}]);