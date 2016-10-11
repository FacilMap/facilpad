(function(fp, $, ng, undefined) {

	fp.app.factory("fpMarked", function() {
		marked.setOptions({
			breaks: true,
			sanitize: true
		});

		return {
			block: function(string, options) {
				var ret = $("<div/>").html(marked(string, options));
				$("a[href]", ret).attr("target", "_blank");
				return ret.html();
			},
			inline: function(string, options) {
				var ret = $("<div/>").html(marked(string, options));
				$("p", ret).replaceWith(function() { return $(this).contents(); });
				$("a[href]", ret).attr("target", "_blank");
				return ret.html();
			}
		};
	});

})(FacilPad, jQuery, angular);