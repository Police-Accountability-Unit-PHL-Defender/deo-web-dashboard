args <- commandArgs(trailingOnly=TRUE)
root <- args[1]
data <- read.csv(file.path(root, "veil-sensitivity.csv"), stringsAsFactors=FALSE)
for (universe in c("black_white", "all_races")) {
  d <- data[data$universe == universe, ]
  svg(file.path(root, paste0("veil-sensitivity-", universe, ".svg")), width=12, height=5.3, pointsize=12)
  par(mfrow=c(1,3), mar=c(5,9,3,1), oma=c(1,0,0,0))
  labels <- paste(d$rule, ifelse(d$mvc == "Recorded MVC", "· MVC", "· all stops"))
  y <- rev(seq_len(nrow(d)))
  for (field in c("before", "after", "change")) {
    value <- d[[field]]; lo <- d[[paste0(field, "_lo")]]; hi <- d[[paste0(field, "_hi")]]
    limits <- range(c(0, lo, hi)); padding <- diff(limits) * .1
    plot(value, y, xlim=limits+c(-padding,padding), ylim=c(.5,nrow(d)+.5), yaxt="n", ylab="", xlab="Percentage points", type="n", bty="n",
         main=switch(field, before="Before the law", after="After the law", change="Pre/post change"))
    abline(v=0, col="#999999", lty=2)
    abline(h=y, col="#eeeeee")
    axis(2, at=y, labels=labels, las=1, tick=FALSE, cex.axis=.75)
    colors <- ifelse(d$mvc == "Recorded MVC", "#77509b", "#20786f")
    segments(lo,y,hi,y,col=colors,lwd=2)
    segments(lo,y-.08,lo,y+.08,col=colors);segments(hi,y-.08,hi,y+.08,col=colors)
    points(value,y,pch=ifelse(d$mvc == "Recorded MVC",16,15),col=colors,cex=1.1)
  }
  mtext("Purple circle: recorded MVC code required. Green square: all vehicle stops. Bars: 95% confidence intervals.", side=1, outer=TRUE, cex=.8)
  dev.off()
}
