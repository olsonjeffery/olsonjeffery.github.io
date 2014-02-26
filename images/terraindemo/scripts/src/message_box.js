(function() {
  this.MessageBox = function() {
    var ev = new MicroEvent();
    var msgs = [];
    var subs = {};
    function MessageBox() {
    };
    MessageBox.prototype.pub = function(addr, data) {
      msgs.push({addr:addr, data:data});
    };
    MessageBox.prototype.sub = function(addr, callback) {
      if (addr in subs) {
        throw "double-sub to "+addr+". no beuno";
      }
      subs[addr] = callback;
    };
    
    MessageBox.prototype.process = function() {
      var pending_msgs = _.map(msgs, function(x){return x;});
      var unprocessed_msgs = [];
      while(pending_msgs.length > 0) {
        var curr_msg = pending_msgs.pop();
        if(!('data' in curr_msg)) {
          throw "no 'data' property in msg! abort.";
        }
        if(!('addr' in curr_msg)) {
          throw "no 'addr' property in msg! abort.";
        }
        if(!(curr_msg.addr in subs)) {
          unprocessed_msgs.push(curr_msg);
        }
        else {
          subs[curr_msg.addr](curr_msg.data);
        }
      }
      msgs = unprocessed_msgs;
    };
    return new MessageBox();
  };
}).call(this);
