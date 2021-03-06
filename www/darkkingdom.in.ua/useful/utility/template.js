const template = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<link rel="shortcut icon" href="../../favicon2.ico" type="image/x-icon">
<style type="text/css">
td {font-family: verdana, arial, helvetica; 
      font-size: 12px; color: #000000 }
A  {text-decoration: none}
 A:hover {color: #808080; text-decoration: underline; }
 
body
{  background-color:#C0C0C0; 
  color:#000000; 
  text-align: justify;} 

.center{
  text-align:center;
}  

.fanfic-body {
  max-width: 1000px;
  margin: 0 auto 20px;
}

.fanfic-body p {
  text-indent: 30px;
 }

.fanfic-body.no-padding p {
  margin: 5px 0;
 }

.fanfic-body p.center {
  text-indent: 0;
}

  
</style>
<title>%AUTHOR% - %TITLE%</title>
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-162056004-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());

  gtag("config", "UA-162056004-1");
</script>
</head>

<body vLink="#C0C0C0" link="#2D2D2D" alink="#808080">

<p align="center"><font face="Arial" color="#000000"><small><small><em>Bishoujo Senshi
Sailormoon is the property of Naoko Takeuchi, Kodanshi Comics, and Toei Animation. &nbsp;</em></small></small></font></p>

<p align="center"><big><strong><font face="Arial">%AUTHOR%</font></strong></big></p>

<p align="center"><em><b><font face="Arial" size="6">%TITLE%</font></b></em></p>

<div class="fanfic-body">
  %TEXT%
</div>

<table border="0" width="350" cellspacing="0" cellpadding="0" style="margin:0 auto;">
  <tr>
    <td width="585" align="left">
    <p align="center"><a href="../%AUTHORPAGE%"><font size="2" color="#2D2D2D">На
    страницу автора</font></a></p>

    <p align="center"><a href="../../fanfics.htm"><font size="2" color="#2D2D2D">Fanfiction</font></a></p>
    <p align="center"><a href="../../index.html"><font size="2" color="#2D2D2D">На
    основную страницу</font></a></td>
  </tr>
</table>
</body>
</html>`;
