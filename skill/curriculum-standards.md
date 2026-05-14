# 课标检索指南（精简版）

制作正式课件前先定位 `node_id`。

```bash
python3 scripts/find_nodes.py "一次函数"
python3 scripts/check_node_id.py <node_id>
```

优先级：
1. 找到官方节点，写入 `manifest.node_id`。
2. 有相近节点，挂到相近节点并在内容中说明范围。
3. 没有节点，用 `register_node.py` 注册占位节点。
4. 完全非课标内容才用 `free_mode: true`。

不要编造 `node_id`，不要手工编辑生成的 registry。
